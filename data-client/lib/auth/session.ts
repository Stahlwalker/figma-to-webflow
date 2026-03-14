import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export interface SessionData {
  figmaAccessToken?: string;
  figmaRefreshToken?: string;
  figmaTokenExpiresAt?: number;
  figmaUserId?: string;
  webflowAccessToken?: string;
  webflowUserId?: string;
  oauthState?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET || "fallback-dev-secret-must-be-at-least-32-chars-long",
  cookieName: "ftw-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

/**
 * Extract tokens from Authorization header (Bearer token).
 * The extension stores tokens in localStorage and sends them as:
 * Authorization: Bearer figma:<token>,webflow:<token>
 */
export function getTokensFromHeader(req: NextRequest): { figmaToken?: string; webflowToken?: string } {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return {};

  const tokenStr = auth.slice(7);
  const result: { figmaToken?: string; webflowToken?: string } = {};

  for (const part of tokenStr.split(",")) {
    const [prefix, token] = part.split(":", 2);
    if (prefix === "figma" && token) result.figmaToken = token;
    if (prefix === "webflow" && token) result.webflowToken = token;
  }

  return result;
}
