import { NextRequest, NextResponse } from "next/server";
import { getTokensFromHeader } from "@/lib/auth/session";
import { getImages } from "@/lib/figma/client";

export async function GET(req: NextRequest) {
  const { figmaToken } = getTokensFromHeader(req);
  if (!figmaToken) {
    return NextResponse.json({ error: "Not authenticated with Figma" }, { status: 401 });
  }

  const fileKey = req.nextUrl.searchParams.get("fileKey");
  const ids = req.nextUrl.searchParams.get("ids");
  const scale = parseInt(req.nextUrl.searchParams.get("scale") || "2", 10);

  if (!fileKey || !ids) {
    return NextResponse.json({ error: "Missing fileKey or ids" }, { status: 400 });
  }

  try {
    const nodeIds = ids.split(",").map((id) => id.trim());
    const data = await getImages(fileKey, nodeIds, figmaToken, scale);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch images";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
