import { NextRequest, NextResponse } from "next/server";
import { parseFigmaUrl, fetchFigmaNode } from "@/lib/figma/client";

export async function POST(req: NextRequest) {
  try {
    const { figmaUrl } = await req.json();
    const figmaToken = process.env.FIGMA_TOKEN;
    if (!figmaUrl || !figmaToken) {
      return NextResponse.json({ error: "Missing URL or token" }, { status: 400 });
    }

    const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);
    if (!fileKey || !nodeId) {
      return NextResponse.json({ error: "Invalid Figma URL" }, { status: 400 });
    }

    const figmaNode = await fetchFigmaNode(fileKey, nodeId, figmaToken);

    // Return raw Figma data for inspection
    return NextResponse.json({ figmaNode });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
