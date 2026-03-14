import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();

  return NextResponse.json({
    figmaConnected: !!session.figmaAccessToken,
    webflowConnected: !!session.webflowAccessToken,
    figmaUserId: session.figmaUserId || null,
  });
}
