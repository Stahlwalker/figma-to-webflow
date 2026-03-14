import { NextRequest, NextResponse } from "next/server";
import { getTokensFromHeader } from "@/lib/auth/session";
import { parseFigmaUrl, getFile, getNodes, getImages } from "@/lib/figma/client";
import { parseSections } from "@/lib/figma/parser";

export async function GET(req: NextRequest) {
  const { figmaToken } = getTokensFromHeader(req);
  if (!figmaToken) {
    return NextResponse.json({ error: "Not authenticated with Figma" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    console.log("[figma/file] token length:", figmaToken.length, "starts:", figmaToken.slice(0, 10));
    const { fileKey, nodeId } = parseFigmaUrl(url);
    console.log("[figma/file] fileKey:", fileKey, "nodeId:", nodeId);

    // Debug: log full auth header
    const rawAuth = req.headers.get("authorization") || "";
    console.log("[figma/file] raw auth header length:", rawAuth.length, "full:", rawAuth);
    // If a specific node is targeted, fetch that node's data directly for full depth
    let fileData;
    if (nodeId) {
      const nodesResponse = await getNodes(fileKey, [nodeId], figmaToken);
      const nodeData = nodesResponse.nodes[nodeId];
      if (!nodeData) {
        return NextResponse.json({ error: "Node not found in Figma file" }, { status: 404 });
      }
      // Wrap in file-like structure for parser
      fileData = { document: nodeData.document, name: nodeData.document.name || "Untitled" };
    } else {
      fileData = await getFile(fileKey, figmaToken);
    }
    const sections = parseSections(fileData, nodeId ? undefined : nodeId);

    // Batch fetch preview images for all sections
    const nodeIds = sections.map((s) => s.nodeId);
    let images: Record<string, string> = {};
    if (nodeIds.length > 0) {
      const imgResponse = await getImages(fileKey, nodeIds, figmaToken);
      images = imgResponse.images || {};
    }

    return NextResponse.json({
      fileName: fileData.name,
      fileKey,
      sections: sections.map((s) => ({
        ...s,
        previewUrl: images[s.nodeId] || null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to read Figma file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
