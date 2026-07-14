import { NextRequest } from "next/server";
import { getSession, deleteSessionCookie } from "@/lib/auth/session";
import { AuditLogger } from "@/lib/logger/auditLogger";
import { jsonSuccess, jsonError } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    const session = await getSession();
    const username = session?.username || "Anonymous";

    // Delete cookie
    await deleteSessionCookie();

    AuditLogger.log({
      event: "LOGOUT",
      username,
      ip,
      userAgent,
    });

    return jsonSuccess("Logged out successfully.");
  } catch (error) {
    return jsonError("INTERNAL_ERROR", "Failed to clear session.", 500);
  }
}
