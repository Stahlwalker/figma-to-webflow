import { NextRequest, NextResponse } from "next/server";
import { getTokensFromHeader } from "@/lib/auth/session";
import { getNodes } from "@/lib/figma/client";
import { mapFigmaToWebflow } from "@/lib/mapper";

export async function POST(req: NextRequest) {
  const { figmaToken } = getTokensFromHeader(req);
  if (!figmaToken) {
    return NextResponse.json({ error: "Not authenticated with Figma" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fileKey, nodeId } = body;

    if (!fileKey || !nodeId) {
      return NextResponse.json({ error: "Missing fileKey or nodeId" }, { status: 400 });
    }

    // Fetch full node data from Figma
    const nodesData = await getNodes(fileKey, [nodeId], figmaToken);
    const nodeData = nodesData.nodes[nodeId];

    if (!nodeData) {
      return NextResponse.json({ error: "Node not found in Figma file" }, { status: 404 });
    }

    // Run the deterministic mapper
    const buildPlan = mapFigmaToWebflow(nodeData.document);

    return NextResponse.json({ buildPlan });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate build plan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
