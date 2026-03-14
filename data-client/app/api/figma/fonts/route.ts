import { NextRequest, NextResponse } from "next/server";
import { getTokensFromHeader } from "@/lib/auth/session";
import { parseFigmaUrl, getFile } from "@/lib/figma/client";
import { extractFonts } from "@/lib/figma/fonts";

export async function GET(req: NextRequest) {
  const { figmaToken } = getTokensFromHeader(req);
  if (!figmaToken) {
    return NextResponse.json({ error: "Not authenticated with Figma" }, { status: 401 });
  }

  const fileKey = req.nextUrl.searchParams.get("fileKey");
  const url = req.nextUrl.searchParams.get("url");

  if (!fileKey && !url) {
    return NextResponse.json({ error: "Missing fileKey or url" }, { status: 400 });
  }

  try {
    const key = fileKey || parseFigmaUrl(url!).fileKey;
    const fileData = await getFile(key, figmaToken, 100);
    const fonts = extractFonts(fileData.document);
    return NextResponse.json({ fonts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to extract fonts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
