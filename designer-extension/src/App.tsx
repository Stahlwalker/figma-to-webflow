import { useState, useEffect, useCallback } from "react";
import {
  getSession,
  getFigmaFile,
  getFigmaFonts,
  type SessionInfo,
  type SectionData,
  type FontData,
  type WebflowSite,
} from "./services/api";
import SetupStep from "./steps/SetupStep";
import SectionsStep from "./steps/SectionsStep";
import FontsStep from "./steps/FontsStep";
import BuildStep from "./steps/BuildStep";

type Step = "setup" | "sections" | "fonts" | "build";

export default function App() {
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [figmaUrl, setFigmaUrl] = useState("");
  const [site, setSite] = useState<WebflowSite | null>(null);
  const [fileKey, setFileKey] = useState("");
  const [sections, setSections] = useState<SectionData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fonts, setFonts] = useState<FontData[]>([]);
  const [confirmedFonts, setConfirmedFonts] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>("setup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSession = useCallback(() => {
    const s = getSession();
    setSession(s);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const setupDone = !!(figmaUrl && site && session?.figmaConnected && session?.webflowConnected);

  async function handleReadFigma() {
    setLoading(true);
    setError(null);
    try {
      const data = await getFigmaFile(figmaUrl);
      setFileKey(data.fileKey);
      setSections(data.sections);
      setSelectedIds(new Set(data.sections.map((s) => s.nodeId)));

      // Fetch fonts
      try {
        const fontData = await getFigmaFonts(data.fileKey);
        setFonts(fontData.fonts);
      } catch {
        setFonts([]);
      }

      setStep("sections");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read Figma file");
    }
    setLoading(false);
  }

  function toggleSection(nodeId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }

  function toggleFont(family: string) {
    setConfirmedFonts((prev) => {
      const next = new Set(prev);
      if (next.has(family)) next.delete(family);
      else next.add(family);
      return next;
    });
  }

  if (!session) {
    return <div style={{ padding: 20, fontSize: 13, color: "#888" }}>Loading...</div>;
  }

  return (
    <div style={{ padding: 16, maxWidth: 480, fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600 }}>
        Figma to Webflow
      </h2>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <p style={{ margin: "0 0 4px", fontSize: 10, color: (window as any).webflow ? "#090" : "#c00" }}>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        Designer API: {(window as any).webflow ? "available" : "not available"}
      </p>
      <p style={{ margin: "0 0 16px", fontSize: 12, color: "#888" }}>
        Import Figma designs directly into Webflow
      </p>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["setup", "sections", "fonts", "build"] as Step[]).map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: stepIndex(step) >= i ? "#146ef5" : "#e0e0e0",
            }}
          />
        ))}
      </div>

      {/* Step content */}
      {step === "setup" && (
        <>
          <StepHeader
            number={1}
            title="Set up your session"
            subtitle="Connect accounts and provide your Figma URL"
          />
          <SetupStep
            session={session}
            figmaUrl={figmaUrl}
            onFigmaUrlChange={setFigmaUrl}
            site={site}
            onSiteSelect={setSite}
            onSessionUpdate={refreshSession}
          />
          {setupDone && (
            <button
              onClick={handleReadFigma}
              disabled={loading}
              style={{ ...primaryBtn, marginTop: 12 }}
            >
              {loading ? "Reading Figma..." : "Read Figma design"}
            </button>
          )}
          {error && <ErrorBox message={error} />}
        </>
      )}

      {step === "sections" && (
        <>
          <StepHeader
            number={2}
            title="Review sections"
            subtitle={`${sections.length} sections detected`}
          />
          <SectionsStep
            sections={sections}
            selectedIds={selectedIds}
            onToggle={toggleSection}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => setStep("setup")} style={secondaryBtn}>
              Back
            </button>
            <button
              onClick={() => setStep("fonts")}
              disabled={selectedIds.size === 0}
              style={primaryBtn}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {step === "fonts" && (
        <>
          <StepHeader
            number={3}
            title="Confirm fonts"
            subtitle="Verify fonts are available in Webflow"
          />
          <FontsStep
            fonts={fonts}
            confirmedFonts={confirmedFonts}
            onToggle={toggleFont}
            onConfirmAll={() => setStep("build")}
            onSkip={() => setStep("build")}
          />
          <button onClick={() => setStep("sections")} style={{ ...secondaryBtn, marginTop: 8 }}>
            Back
          </button>
        </>
      )}

      {step === "build" && (
        <>
          <StepHeader
            number={4}
            title="Build sections"
            subtitle="Create elements in Webflow"
          />
          <BuildStep
            fileKey={fileKey}
            sections={sections}
            selectedIds={selectedIds}
          />
          <button onClick={() => setStep("fonts")} style={{ ...secondaryBtn, marginTop: 8 }}>
            Back
          </button>
        </>
      )}
    </div>
  );
}

function StepHeader({
  number,
  title,
  subtitle,
}: {
  number: number;
  title: string;
  subtitle: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "#146ef5",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {number}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ fontSize: 11, color: "#888" }}>{subtitle}</div>
      </div>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div
      style={{
        marginTop: 8,
        padding: "8px 12px",
        background: "#FFF5F5",
        border: "1px solid #F7C1C1",
        borderRadius: 6,
        fontSize: 12,
        color: "#c00",
      }}
    >
      {message}
    </div>
  );
}

function stepIndex(step: Step): number {
  return ["setup", "sections", "fonts", "build"].indexOf(step);
}

const primaryBtn: React.CSSProperties = {
  fontSize: 13,
  padding: "8px 16px",
  background: "#146ef5",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
};

const secondaryBtn: React.CSSProperties = {
  fontSize: 13,
  padding: "8px 16px",
  background: "transparent",
  color: "#666",
  border: "1px solid #ddd",
  borderRadius: 6,
  cursor: "pointer",
};
