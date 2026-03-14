import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Exchange code for token
  const res = await fetch("https://api.webflow.com/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.WEBFLOW_CLIENT_ID!,
      client_secret: process.env.WEBFLOW_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/webflow/callback`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: "webflow-auth-error", error: ${JSON.stringify(err)} }, "*");
        window.close();
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const tokens = await res.json();

  return new NextResponse(
    `<html><body><script>
      window.opener?.postMessage({
        type: "webflow-auth-success",
        accessToken: ${JSON.stringify(tokens.access_token)}
      }, "*");
      window.close();
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
