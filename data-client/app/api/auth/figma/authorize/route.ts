import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const state = uuid();
  const session = await getSession();
  session.oauthState = state;
  await session.save();

  const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/figma/callback`);
  // Build URL manually to avoid URLSearchParams encoding colons in scopes
  const url = `https://www.figma.com/oauth?client_id=${process.env.FIGMA_CLIENT_ID}&redirect_uri=${redirectUri}&scope=file_content:read&state=${state}&response_type=code`;

  return NextResponse.redirect(url);
}
