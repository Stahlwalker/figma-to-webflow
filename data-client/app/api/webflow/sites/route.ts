import { NextRequest, NextResponse } from "next/server";
import { getTokensFromHeader } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const { webflowToken } = getTokensFromHeader(req);
  if (!webflowToken) {
    return NextResponse.json({ error: "Not authenticated with Webflow" }, { status: 401 });
  }

  try {
    const res = await fetch("https://api.webflow.com/v2/sites", {
      headers: {
        Authorization: `Bearer ${webflowToken}`,
        "accept": "application/json",
      },
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Webflow API error: ${err}` }, { status: res.status });
    }

    const data = await res.json();
    const sites = (data.sites || []).map((s: { id: string; displayName: string; shortName: string }) => ({
      id: s.id,
      displayName: s.displayName || s.shortName,
    }));

    return NextResponse.json({ sites });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch sites";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
