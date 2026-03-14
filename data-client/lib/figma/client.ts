import { FigmaFileResponse, FigmaNodesResponse, FigmaImagesResponse } from "./types";
import { cacheGet, cacheSet } from "../cache";

const FIGMA_API = "https://api.figma.com/v1";

interface RateLimitState {
  remaining: number;
  resetAt: number;
}

const rateLimits = new Map<string, RateLimitState>();

function updateRateLimit(token: string, headers: Headers): void {
  const remaining = headers.get("x-ratelimit-remaining");
  const reset = headers.get("x-ratelimit-reset");
  if (remaining !== null && reset !== null) {
    rateLimits.set(token, {
      remaining: parseInt(remaining, 10),
      resetAt: parseInt(reset, 10) * 1000,
    });
  }
}

async function waitForRateLimit(token: string): Promise<void> {
  const limit = rateLimits.get(token);
  if (limit && limit.remaining <= 1 && Date.now() < limit.resetAt) {
    const waitMs = limit.resetAt - Date.now() + 100;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}

async function figmaFetch<T>(
  path: string,
  token: string,
  retries = 2
): Promise<T> {
  await waitForRateLimit(token);

  const res = await fetch(`${FIGMA_API}${path}`, {
    headers: { "X-Figma-Token": token },
  });

  updateRateLimit(token, res.headers);

  if (res.status === 429 && retries > 0) {
    const retryAfter = parseInt(res.headers.get("retry-after") || "10", 10);
    await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
    return figmaFetch(path, token, retries - 1);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Figma API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export async function getFile(
  fileKey: string,
  token: string,
  depth = 2
): Promise<FigmaFileResponse> {
  const cacheKey = `figma:file:${fileKey}:d${depth}`;
  const cached = cacheGet<FigmaFileResponse>(cacheKey);
  if (cached) return cached;

  const data = await figmaFetch<FigmaFileResponse>(
    `/files/${fileKey}?depth=${depth}`,
    token
  );
  cacheSet(cacheKey, data);
  return data;
}

export async function getNodes(
  fileKey: string,
  nodeIds: string[],
  token: string
): Promise<FigmaNodesResponse> {
  const ids = nodeIds.join(",");
  const cacheKey = `figma:nodes:${fileKey}:${ids}`;
  const cached = cacheGet<FigmaNodesResponse>(cacheKey);
  if (cached) return cached;

  const data = await figmaFetch<FigmaNodesResponse>(
    `/files/${fileKey}/nodes?ids=${encodeURIComponent(ids)}`,
    token
  );
  cacheSet(cacheKey, data);
  return data;
}

export async function getImages(
  fileKey: string,
  nodeIds: string[],
  token: string,
  scale = 2,
  format: "png" | "svg" | "jpg" = "png"
): Promise<FigmaImagesResponse> {
  const ids = nodeIds.join(",");
  const cacheKey = `figma:images:${fileKey}:${ids}:s${scale}:${format}`;
  const cached = cacheGet<FigmaImagesResponse>(cacheKey);
  if (cached) return cached;

  const data = await figmaFetch<FigmaImagesResponse>(
    `/images/${fileKey}?ids=${encodeURIComponent(ids)}&scale=${scale}&format=${format}`,
    token
  );
  cacheSet(cacheKey, data);
  return data;
}

export function parseFigmaUrl(url: string): {
  fileKey: string;
  nodeId?: string;
} {
  // Handle branch URLs: figma.com/design/:fileKey/branch/:branchKey/:fileName
  const branchMatch = url.match(
    /figma\.com\/(?:file|design)\/[a-zA-Z0-9]+\/branch\/([a-zA-Z0-9]+)/
  );
  if (branchMatch) {
    const nodeId = extractNodeId(url);
    return { fileKey: branchMatch[1], nodeId };
  }

  // Standard: figma.com/design/:fileKey/:fileName or figma.com/file/:fileKey/:fileName
  const fileMatch = url.match(
    /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/
  );
  if (!fileMatch) {
    throw new Error("Could not parse Figma file key from URL");
  }

  const nodeId = extractNodeId(url);
  return { fileKey: fileMatch[1], nodeId };
}

function extractNodeId(url: string): string | undefined {
  const match = url.match(/node-id=([^&]+)/);
  if (!match) return undefined;
  return decodeURIComponent(match[1]).replace(/-/g, ":");
}
