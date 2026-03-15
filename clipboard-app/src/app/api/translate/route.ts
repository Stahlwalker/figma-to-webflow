import { NextRequest, NextResponse } from "next/server";
import { parseFigmaUrl, fetchFigmaNode } from "@/lib/figma/client";
import { mapFigmaToWebflow } from "@/lib/translator";
import { buildXscpData, serializeXscpData } from "@/lib/webflow/xscpdata";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { figmaUrl } = body;
    const figmaToken = process.env.FIGMA_TOKEN;

    if (!figmaUrl) {
      return NextResponse.json(
        { error: "figmaUrl is required" },
        { status: 400 }
      );
    }
    if (!figmaToken) {
      return NextResponse.json(
        { error: "FIGMA_TOKEN environment variable is not set" },
        { status: 500 }
      );
    }

    // Parse the Figma URL
    const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);
    if (!fileKey) {
      return NextResponse.json(
        { error: "Could not parse Figma file key from URL" },
        { status: 400 }
      );
    }
    if (!nodeId) {
      return NextResponse.json(
        { error: "Figma URL must include a node-id parameter (select a frame/section in Figma)" },
        { status: 400 }
      );
    }

    // Fetch the Figma node
    const figmaNode = await fetchFigmaNode(fileKey, nodeId, figmaToken);

    // Translate Figma → WebflowBuildPlan
    const buildPlan = mapFigmaToWebflow(figmaNode);

    // Convert to XscpData clipboard format
    const xscpData = buildXscpData(buildPlan);
    const json = serializeXscpData(xscpData);

    return NextResponse.json({
      xscpData: json,
      buildPlan,
      nodeCount: xscpData.payload.nodes.length,
      styleCount: xscpData.payload.styles.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
