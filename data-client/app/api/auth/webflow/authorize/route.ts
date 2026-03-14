import { NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const state = uuid();
  const session = await getSession();
  session.oauthState = state;
  await session.save();

  const params = new URLSearchParams({
    client_id: process.env.WEBFLOW_CLIENT_ID!,
    response_type: "code",
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/webflow/callback`,
    scope: "sites:read sites:write",
    state,
  });

  return NextResponse.redirect(`https://webflow.com/oauth/authorize?${params}`);
}
