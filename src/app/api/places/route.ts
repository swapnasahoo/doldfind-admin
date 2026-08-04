import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security";
import { getPlaceRepository } from "@/lib/repositories/getPlaceRepository";
import { Logger } from "@/lib/logger";
import { AuditLogger } from "@/lib/logger/auditLogger";
import { jsonError, jsonSuccess } from "@/lib/utils/response";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // 1. Session verification (Authentication)
  const session = await getSession();
  if (!session) {
    AuditLogger.log({
      event: "AUTH_FAILED",
      username: "Anonymous",
      ip,
      userAgent,
      details: { action: "list_places", reason: "Missing active session" },
    });
    return jsonError("UNAUTHORIZED", "Unauthenticated. Please log in first.", 401);
  }

  const username = session.username;
  const badge = session.badge;

  // 2. Rate Limiting protection
  const isAllowed = checkRateLimit(ip, "list_places", 30, 60 * 1000); // 30 requests per minute
  if (!isAllowed) {
    AuditLogger.log({
      event: "RATE_LIMIT_EXCEEDED",
      username,
      ip,
      userAgent,
      details: { action: "list_places" },
    });
    return jsonError("RATE_LIMIT", "Too many requests. Please wait a minute.", 429);
  }

  try {
    const repository = getPlaceRepository();
    const places = await repository.findAll();

    AuditLogger.log({
      event: "PLACE_VIEWED",
      username,
      badge,
      ip,
      userAgent,
      details: { count: places.length },
    });

    const res = jsonSuccess("Places fetched successfully.", undefined, 200, places);
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    return res;
  } catch (error) {
    Logger.error("Failed to list places:", error);
    return jsonError("INTERNAL_ERROR", "An internal error occurred while fetching places.", 500);
  }
}

export async function POST() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PUT() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function DELETE() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PATCH() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function HEAD() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function OPTIONS() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
