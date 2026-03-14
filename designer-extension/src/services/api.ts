// When served via webflow extension serve, the extension is on Webflow's domain
// so we can make cross-origin requests to our backend
const API_BASE = import.meta.env.VITE_API_URL || "https://localhost:3000";

// Token storage
const TOKEN_KEY = "ftw-tokens";

interface StoredTokens {
  figmaAccessToken?: string;
  webflowAccessToken?: string;
}

export function getStoredTokens(): StoredTokens {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function storeTokens(update: Partial<StoredTokens>): void {
  const current = getStoredTokens();
  localStorage.setItem(TOKEN_KEY, JSON.stringify({ ...current, ...update }));
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function buildAuthHeader(): string {
  const tokens = getStoredTokens();
  const parts: string[] = [];
  if (tokens.figmaAccessToken) parts.push(`figma:${tokens.figmaAccessToken}`);
  if (tokens.webflowAccessToken) parts.push(`webflow:${tokens.webflowAccessToken}`);
  return parts.join(",");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const auth = buildAuthHeader();
  const url = `${API_BASE}${path}`;
  console.log("[apiFetch]", url, "auth:", auth ? "present" : "missing");

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
        "ngrok-skip-browser-warning": "1",
        ...options?.headers,
      },
    });
  } catch (err) {
    console.error("[apiFetch] Network error fetching", url, err);
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[apiFetch] HTTP error", res.status, text);
    let errorMsg: string;
    try {
      const body = JSON.parse(text);
      errorMsg = body.error || `API error ${res.status}`;
    } catch {
      errorMsg = `API error ${res.status}: ${text.slice(0, 200)}`;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export interface SessionInfo {
  figmaConnected: boolean;
  webflowConnected: boolean;
}

export interface SectionData {
  id: string;
  label: string;
  nodeId: string;
  width?: number;
  height?: number;
  previewUrl?: string;
}

export interface FileData {
  fileName: string;
  fileKey: string;
  sections: SectionData[];
}

export interface FontData {
  family: string;
  weights: number[];
}

export interface WebflowSite {
  id: string;
  displayName: string;
}

export interface BuildPlanNode {
  tag: string;
  preset: string;
  styleName: string;
  styles: Record<string, string>;
  textContent?: string;
  children: BuildPlanNode[];
  figmaNodeId: string;
  figmaNodeName: string;
}

export function getSession(): SessionInfo {
  const tokens = getStoredTokens();
  return {
    figmaConnected: !!tokens.figmaAccessToken,
    webflowConnected: !!tokens.webflowAccessToken,
  };
}

export function getFigmaFile(figmaUrl: string): Promise<FileData> {
  return apiFetch(`/api/figma/file?url=${encodeURIComponent(figmaUrl)}`);
}

export function getFigmaFonts(fileKey: string): Promise<{ fonts: FontData[] }> {
  return apiFetch(`/api/figma/fonts?fileKey=${fileKey}`);
}

export function getWebflowSites(): Promise<{ sites: WebflowSite[] }> {
  return apiFetch("/api/webflow/sites");
}

export function getBuildPlan(
  fileKey: string,
  nodeId: string
): Promise<{ buildPlan: BuildPlanNode }> {
  return apiFetch("/api/mapper/build-plan", {
    method: "POST",
    body: JSON.stringify({ fileKey, nodeId }),
  });
}

// Auth URLs open in popup windows (not iframe fetches), so they need the full backend URL
const AUTH_BASE = import.meta.env.VITE_API_URL || "https://localhost:3000";

export function getFigmaAuthUrl(): string {
  return `${AUTH_BASE}/api/auth/figma/authorize`;
}

export function getWebflowAuthUrl(): string {
  return `${AUTH_BASE}/api/auth/webflow/authorize`;
}
