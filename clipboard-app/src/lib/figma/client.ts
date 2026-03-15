import { FigmaNode, FigmaNodesResponse } from "./types";

export function parseFigmaUrl(url: string): {
  fileKey: string;
  nodeId?: string;
} {
  const parsed = new URL(url);
  const pathParts = parsed.pathname.split("/");

  // figma.com/design/:fileKey/:fileName
  // figma.com/file/:fileKey/:fileName
  let fileKey = "";
  const designIdx = pathParts.indexOf("design");
  const fileIdx = pathParts.indexOf("file");
  const branchIdx = pathParts.indexOf("branch");

  if (branchIdx !== -1 && pathParts[branchIdx + 1]) {
    // Branch URL: use branchKey as fileKey
    fileKey = pathParts[branchIdx + 1];
  } else if (designIdx !== -1 && pathParts[designIdx + 1]) {
    fileKey = pathParts[designIdx + 1];
  } else if (fileIdx !== -1 && pathParts[fileIdx + 1]) {
    fileKey = pathParts[fileIdx + 1];
  }

  // node-id parameter (Figma uses "-" in URL, ":" in API)
  const nodeId = parsed.searchParams.get("node-id")?.replace("-", ":") || undefined;

  return { fileKey, nodeId };
}

export async function fetchFigmaNode(
  fileKey: string,
  nodeId: string,
  token: string
): Promise<FigmaNode> {
  const url = `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`;

  const res = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API error ${res.status}: ${text}`);
  }

  const data: FigmaNodesResponse = await res.json();
  const nodeData = data.nodes[nodeId];
  if (!nodeData) {
    throw new Error(`Node ${nodeId} not found in Figma file`);
  }

  return nodeData.document;
}

export async function fetchFigmaFile(
  fileKey: string,
  token: string
): Promise<FigmaNode> {
  const url = `https://api.figma.com/v1/files/${fileKey}`;

  const res = await fetch(url, {
    headers: { "X-Figma-Token": token },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Figma API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data.document;
}
