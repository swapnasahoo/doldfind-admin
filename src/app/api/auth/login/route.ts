import { NextRequest } from "next/server";
import { z } from "zod";
import { AuthService } from "@/lib/services/authService";
import { createSessionCookie } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security";
import { Logger } from "@/lib/logger";
import { AuditLogger } from "@/lib/logger/auditLogger";
import { jsonError, jsonSuccess } from "@/lib/utils/response";

// Strict input validation schema
const loginSchema = z
  .object({
    username: z.string().trim().min(1, "Username is required").max(50),
    password: z.string().min(1, "Password is required").max(100),
  })
  .strict(); // Reject unknown fields

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Content-Type validation
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return jsonError("BAD_REQUEST", "Unsupported Content-Type. Please use application/json.", 400);
  }

  // 1. Rate Limiting protection
  const isAllowed = checkRateLimit(ip, "login", 5, 60 * 1000); // 5 attempts per min
  if (!isAllowed) {
    AuditLogger.log({
      event: "RATE_LIMIT_EXCEEDED",
      username: "Anonymous",
      ip,
      userAgent,
      details: { action: "login" },
    });
    return jsonError("RATE_LIMIT", "Too many attempts. Please try again later.", 429);
  }

  try {
    // 2. Size limit checks to reject huge payloads
    const bodyText = await request.text();
    if (bodyText.length > 2000) {
      Logger.warn(`Suspiciously large payload rejected from IP: ${ip}`);
      return jsonError("BAD_REQUEST", "Payload size limit exceeded.", 400);
    }

    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch (parseErr) {
      return jsonError("BAD_REQUEST", "Invalid JSON format.", 400);
    }

    const parseResult = loginSchema.safeParse(body);
    if (!parseResult.success) {
      AuditLogger.log({
        event: "VALIDATION_FAILED",
        username: (body && typeof body === "object" ? body.username : "Unknown") || "Unknown",
        ip,
        userAgent,
        details: { errors: "Validation failed (fields sanitized)." },
      });
      return jsonError("VALIDATION_ERROR", "Invalid credentials or input format.", 400);
    }

    const { username, password } = parseResult.data;

    // 3. Verify credentials via service layer
    const authResult = await AuthService.login(username, password);

    if (authResult.success && authResult.username && authResult.badge) {
      // 4. Create and set session cookie
      await createSessionCookie(authResult.username, authResult.badge);

      AuditLogger.log({
        event: "LOGIN_SUCCESS",
        username: authResult.username,
        ip,
        userAgent,
      });

      return jsonSuccess("Login successful.");
    } else {
      AuditLogger.log({
        event: "LOGIN_FAILED",
        username,
        ip,
        userAgent,
        details: { reason: "Invalid credentials" }, // Don't log exact message/hash parameters
      });

      const statusCode = authResult.errorCode === "LOCKOUT" ? 423 : 401;
      return jsonError(authResult.errorCode || "UNAUTHORIZED", authResult.errorMessage, statusCode);
    }
  } catch (error) {
    AuditLogger.log({
      event: "AUTH_FAILED",
      username: "Anonymous",
      ip,
      userAgent,
      details: { errorRaw: "An internal login error occurred." },
    });
    return jsonError("INTERNAL_ERROR", "A security verification error occurred.", 500);
  }
}

// Fallback handler to reject unsupported methods
export async function GET() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PUT() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function DELETE() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PATCH() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function HEAD() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function OPTIONS() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
