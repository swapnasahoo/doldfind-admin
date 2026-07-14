import { NextRequest } from "next/server";
import { getSession, renewSessionCookieIfNeeded } from "@/lib/auth/session";
import { jsonSuccess, jsonError } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return jsonError("UNAUTHORIZED", "Unauthenticated session.", 401);
    }

    // Attempt renewal if close to expiration
    await renewSessionCookieIfNeeded(session);

    return jsonSuccess("Session active.", undefined, 200, {
      username: session.username,
      badge: session.badge,
    });
  } catch (error) {
    return jsonError("INTERNAL_ERROR", "Failed to retrieve session.", 500);
  }
}
