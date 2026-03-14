import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // Exchange code for tokens
  const res = await fetch("https://api.figma.com/v1/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.FIGMA_CLIENT_ID!,
      client_secret: process.env.FIGMA_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/figma/callback`,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return new NextResponse(
      `<html><body><script>
        window.opener?.postMessage({ type: "figma-auth-error", error: ${JSON.stringify(err)} }, "*");
        window.close();
      </script></body></html>`,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  const tokens = await res.json();

  // Return tokens to the popup via postMessage
  return new NextResponse(
    `<html><body><script>
      window.opener?.postMessage({
        type: "figma-auth-success",
        accessToken: ${JSON.stringify(tokens.access_token)},
        refreshToken: ${JSON.stringify(tokens.refresh_token || "")},
        expiresIn: ${tokens.expires_in || 0}
      }, "*");
      window.close();
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
