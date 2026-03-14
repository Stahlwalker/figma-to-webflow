import { useState } from "react";
import type { SessionInfo, WebflowSite } from "../services/api";
import {
  getWebflowAuthUrl,
  getWebflowSites,
  storeTokens,
  clearTokens,
} from "../services/api";

interface Props {
  session: SessionInfo;
  figmaUrl: string;
  onFigmaUrlChange: (url: string) => void;
  site: WebflowSite | null;
  onSiteSelect: (site: WebflowSite) => void;
  onSessionUpdate: () => void;
}

export default function SetupStep({
  session,
  figmaUrl,
  onFigmaUrlChange,
  site,
  onSiteSelect,
  onSessionUpdate,
}: Props) {
  const [sites, setSites] = useState<WebflowSite[] | null>(null);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [figmaTokenInput, setFigmaTokenInput] = useState("");

  function openAuthPopup(url: string) {
    const popup = window.open(url, "webflow-auth", "width=600,height=700");
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "webflow-auth-success") {
        window.removeEventListener("message", handler);
        popup?.close();
        if (e.data.accessToken) {
          storeTokens({ webflowAccessToken: e.data.accessToken });
        }
        onSessionUpdate();
      }
    };
    window.addEventListener("message", handler);
  }

  function saveFigmaToken() {
    if (figmaTokenInput.trim()) {
      storeTokens({ figmaAccessToken: figmaTokenInput.trim() });
      onSessionUpdate();
    }
  }

  async function fetchSites() {
    setSitesLoading(true);
    setSitesError(null);
    try {
      const data = await getWebflowSites();
      setSites(data.sites);
    } catch (err) {
      console.error("Fetch sites error:", err);
      const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
      setSitesError(msg);
    }
    setSitesLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Figma token */}
      {session.figmaConnected ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={pillStyle("#EAF3DE", "#27500A", "#C0DD97")}>Figma connected</span>
          <span onClick={() => { clearTokens(); onSessionUpdate(); }} style={reconnectStyle}>
            Disconnect
          </span>
        </div>
      ) : (
        <div>
          <label style={labelStyle}>Figma personal access token</label>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type="password"
              placeholder="figd_..."
              value={figmaTokenInput}
              onChange={(e) => setFigmaTokenInput(e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            />
            <button onClick={saveFigmaToken} disabled={!figmaTokenInput.trim()} style={btnStyle}>
              Save
            </button>
          </div>
          <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>
            Figma → Settings → Security → Personal access tokens (file_content:read)
          </p>
        </div>
      )}

      {/* Webflow auth */}
      {session.webflowConnected ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={pillStyle("#EAF3DE", "#27500A", "#C0DD97")}>Webflow connected</span>
          <span onClick={() => { clearTokens(); onSessionUpdate(); }} style={reconnectStyle}>
            Disconnect
          </span>
        </div>
      ) : (
        <button onClick={() => openAuthPopup(getWebflowAuthUrl())} style={btnStyle}>
          Connect Webflow
        </button>
      )}

      {/* Figma URL */}
      {session.figmaConnected && (
        <div>
          <label style={labelStyle}>Figma frame URL</label>
          <input
            type="text"
            placeholder="https://www.figma.com/design/abc/File?node-id=1-2"
            value={figmaUrl}
            onChange={(e) => onFigmaUrlChange(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>
            Right-click a frame in Figma → Copy link
          </p>
        </div>
      )}

      {/* Webflow site */}
      {session.webflowConnected && !site && (
        <div>
          <label style={labelStyle}>Webflow site</label>
          {!sites && (
            <button onClick={fetchSites} disabled={sitesLoading} style={btnStyle}>
              {sitesLoading ? "Loading..." : "Fetch my sites"}
            </button>
          )}
          {sitesError && <p style={{ color: "#c00", fontSize: 12 }}>{sitesError}</p>}
          {sites && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {sites.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSiteSelect(s)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #ddd",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  {s.displayName}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {site && (
        <div style={pillStyle("#E6F1FB", "#0C447C", "#B5D4F4")}>
          Site: {site.displayName}
          <span
            onClick={() => onSiteSelect(null!)}
            style={{ marginLeft: 8, cursor: "pointer", textDecoration: "underline", fontSize: 11 }}
          >
            Change
          </span>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#666",
  display: "block",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  fontSize: 13,
  border: "1.5px solid #d0d0d0",
  borderRadius: 6,
  padding: "8px 10px",
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  fontSize: 13,
  padding: "8px 14px",
  background: "#146ef5",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 500,
};

const reconnectStyle: React.CSSProperties = {
  marginLeft: 8,
  cursor: "pointer",
  textDecoration: "underline",
  fontSize: 10,
  opacity: 0.7,
};

function pillStyle(bg: string, color: string, border: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 20,
    background: bg,
    color,
    border: `1px solid ${border}`,
  };
}
