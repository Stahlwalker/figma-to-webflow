import { useState } from "react";
import type { SectionData } from "../services/api";
import { getBuildPlan } from "../services/api";
import { buildSection } from "../builder/element-creator";
import type { BuildProgress } from "../builder/types";

interface Props {
  fileKey: string;
  sections: SectionData[];
  selectedIds: Set<string>;
}

interface SectionStatus {
  status: "idle" | "building" | "done" | "error";
  progress?: BuildProgress;
  error?: string;
  elementsCreated?: number;
}

export default function BuildStep({ fileKey, sections, selectedIds }: Props) {
  const [statuses, setStatuses] = useState<Record<string, SectionStatus>>({});
  const selected = sections.filter((s) => selectedIds.has(s.nodeId));

  function updateStatus(nodeId: string, update: Partial<SectionStatus>) {
    setStatuses((prev) => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], ...update },
    }));
  }

  async function handleBuild(section: SectionData) {
    updateStatus(section.nodeId, { status: "building", error: undefined });

    try {
      // Verify Designer API is available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(window as any).webflow) {
        throw new Error("Webflow Designer API not available. Make sure to open this extension from the Webflow Designer Apps panel.");
      }

      // Step 1: Get build plan from backend
      updateStatus(section.nodeId, {
        progress: {
          status: "building",
          current: "Fetching build plan...",
          total: 0,
          completed: 0,
          errors: [],
        },
      });

      const { buildPlan } = await getBuildPlan(fileKey, section.nodeId);

      // Step 2: Execute build plan via Designer API
      const result = await buildSection(buildPlan, (progress) => {
        updateStatus(section.nodeId, { progress });
      });

      if (result.success) {
        updateStatus(section.nodeId, {
          status: "done",
          elementsCreated: result.elementsCreated,
        });
      } else {
        updateStatus(section.nodeId, {
          status: "error",
          error: result.errors.join("; "),
        });
      }
    } catch (err) {
      updateStatus(section.nodeId, {
        status: "error",
        error: err instanceof Error ? err.message : "Build failed",
      });
    }
  }

  async function handleBuildAll() {
    for (const section of selected) {
      const status = statuses[section.nodeId];
      if (status?.status === "done") continue;
      await handleBuild(section);
    }
  }

  const allDone = selected.every((s) => statuses[s.nodeId]?.status === "done");
  const anyBuilding = selected.some((s) => statuses[s.nodeId]?.status === "building");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        <button onClick={handleBuildAll} disabled={anyBuilding || allDone} style={primaryBtn(anyBuilding)}>
          {allDone ? "All sections built" : anyBuilding ? "Building..." : "Build all sections"}
        </button>
      </div>

      {selected.map((s) => {
        const st = statuses[s.nodeId] || { status: "idle" };
        return (
          <div
            key={s.nodeId}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${borderColor(st.status)}`,
              background: bgColor(st.status),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusDot status={st.status} />
              <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{s.label}</span>

              {st.status === "idle" && (
                <button
                  onClick={() => handleBuild(s)}
                  disabled={anyBuilding}
                  style={{
                    fontSize: 12,
                    padding: "4px 12px",
                    background: "#146ef5",
                    color: "#fff",
                    border: "none",
                    borderRadius: 5,
                    cursor: anyBuilding ? "not-allowed" : "pointer",
                    fontWeight: 500,
                  }}
                >
                  Build
                </button>
              )}
              {st.status === "done" && (
                <span style={{ fontSize: 12, color: "#27500A", fontWeight: 500 }}>
                  {st.elementsCreated} elements
                </span>
              )}
            </div>

            {st.status === "building" && st.progress && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 3 }}>
                  {st.progress.current}
                </div>
                {st.progress.total > 0 && (
                  <div
                    style={{
                      height: 4,
                      background: "#e0e0e0",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${(st.progress.completed / st.progress.total) * 100}%`,
                        background: "#146ef5",
                        borderRadius: 2,
                        transition: "width 0.2s",
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {st.status === "error" && st.error && (
              <div style={{ marginTop: 6, fontSize: 12, color: "#c00" }}>
                {st.error}
                <button
                  onClick={() => handleBuild(s)}
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    padding: "2px 8px",
                    background: "transparent",
                    border: "1px solid #c00",
                    borderRadius: 4,
                    color: "#c00",
                    cursor: "pointer",
                  }}
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        );
      })}

      {allDone && (
        <div
          style={{
            padding: "12px 16px",
            background: "#EAF3DE",
            border: "1px solid #C0DD97",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: "#27500A",
          }}
        >
          All sections built successfully!
        </div>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    idle: "#d0d0d0",
    building: "#146ef5",
    done: "#639922",
    error: "#c00",
  };
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: colors[status] || "#d0d0d0",
        flexShrink: 0,
      }}
    />
  );
}

function borderColor(status: string): string {
  switch (status) {
    case "done": return "#C0DD97";
    case "building": return "#B5D4F4";
    case "error": return "#F7C1C1";
    default: return "#ddd";
  }
}

function bgColor(status: string): string {
  switch (status) {
    case "done": return "#EAF3DE";
    case "building": return "#F0F7FF";
    case "error": return "#FFF5F5";
    default: return "#fafafa";
  }
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    fontSize: 13,
    padding: "8px 16px",
    background: disabled ? "#ccc" : "#146ef5",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 500,
  };
}
