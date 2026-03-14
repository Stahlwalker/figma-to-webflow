import type { FontData } from "../services/api";

interface Props {
  fonts: FontData[];
  confirmedFonts: Set<string>;
  onToggle: (family: string) => void;
  onConfirmAll: () => void;
  onSkip: () => void;
}

const WEBFLOW_SYSTEM_FONTS = ["Inter", "WF Visual Sans"];

export default function FontsStep({
  fonts,
  confirmedFonts,
  onToggle,
  onConfirmAll,
  onSkip,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 12, color: "#666", margin: 0 }}>
        Ensure these fonts are added in Webflow before building.
      </p>

      {fonts.map((f) => {
        const isSystem = WEBFLOW_SYSTEM_FONTS.includes(f.family);
        const isReady = isSystem || confirmedFonts.has(f.family);

        return (
          <div
            key={f.family}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: 7,
              border: `1px solid ${isReady ? "#C0DD97" : "#ddd"}`,
              background: isReady ? "#EAF3DE" : "#fafafa",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{f.family}</div>
              <div style={{ fontSize: 11, color: "#888" }}>
                Weights: {f.weights.join(", ")}
              </div>
            </div>
            {isSystem ? (
              <span style={{ fontSize: 12, color: "#27500A", fontWeight: 500 }}>System</span>
            ) : (
              <button
                onClick={() => onToggle(f.family)}
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  background: isReady ? "#EAF3DE" : "#146ef5",
                  color: isReady ? "#27500A" : "#fff",
                  border: isReady ? "1px solid #C0DD97" : "none",
                  borderRadius: 5,
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {isReady ? "Added" : "Mark as added"}
              </button>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button onClick={onConfirmAll} style={primaryBtn}>
          Confirm fonts
        </button>
        <button onClick={onSkip} style={secondaryBtn}>
          Skip
        </button>
      </div>
    </div>
  );
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
