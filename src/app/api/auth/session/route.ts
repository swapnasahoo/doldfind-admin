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

    const res = jsonSuccess("Session active.", undefined, 200, {
      username: session.username,
      badge: session.badge,
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  } catch (error) {
    return jsonError("INTERNAL_ERROR", "Failed to retrieve session.", 500);
  }
}

// Fallback handlers to reject unsupported methods
export async function POST() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PUT() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function DELETE() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PATCH() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function HEAD() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function OPTIONS() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
