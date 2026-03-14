import type { SectionData } from "../services/api";

interface Props {
  sections: SectionData[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function SectionsStep({ sections, selectedIds, onToggle }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <p style={{ fontSize: 12, color: "#666", margin: "0 0 4px" }}>
        {sections.length} sections detected. Toggle to include or exclude from build.
      </p>
      {sections.map((s) => {
        const selected = selectedIds.has(s.nodeId);
        return (
          <div
            key={s.nodeId}
            onClick={() => onToggle(s.nodeId)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              border: `1px solid ${selected ? "#B5D4F4" : "#ddd"}`,
              background: selected ? "#F0F7FF" : "#fafafa",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={selected}
              readOnly
              style={{ accentColor: "#146ef5" }}
            />
            {s.previewUrl && (
              <img
                src={s.previewUrl}
                alt={s.label}
                style={{
                  width: 60,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 4,
                  border: "1px solid #eee",
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</div>
              {s.width && s.height && (
                <div style={{ fontSize: 11, color: "#888" }}>
                  {Math.round(s.width)} x {Math.round(s.height)}
                </div>
              )}
            </div>
            <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>
              {s.nodeId}
            </span>
          </div>
        );
      })}
    </div>
  );
}
