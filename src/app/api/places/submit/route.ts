import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit, validateSafePayload } from "@/lib/security";
import { placeSchema } from "@/schemas/placeSchema";
import { GoogleSheetsPlaceRepository } from "@/lib/repositories/googleSheetsPlaceRepository";
import { PlaceSubmissionService } from "@/lib/services/placeSubmissionService";
import { Logger } from "@/lib/logger";
import { AuditLogger } from "@/lib/logger/auditLogger";
import { jsonError, jsonSuccess } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
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
      details: { action: "submit_place", reason: "Missing active session" },
    });
    return jsonError("UNAUTHORIZED", "Unauthenticated. Please log in first.", 401);
  }

  const username = session.username;
  const badge = session.badge;

  // 2. Rate Limiting protection
  const isAllowed = checkRateLimit(ip, "submit_place", 10, 60 * 1000); // 10 submissions per minute
  if (!isAllowed) {
    AuditLogger.log({
      event: "RATE_LIMIT_EXCEEDED",
      username,
      ip,
      userAgent,
      details: { action: "submit_place" },
    });
    return jsonError("RATE_LIMIT", "Too many submissions. Please wait a minute.", 429);
  }

  try {
    // 3. Size limit check
    const bodyText = await request.text();
    if (bodyText.length > 50000) { // Limit to 50KB payload
      Logger.warn(`Suspiciously large place submission payload rejected from user: ${username}`);
      return jsonError("BAD_REQUEST", "Payload size limit exceeded.", 400);
    }

    const body = JSON.parse(bodyText);

    // 4. WAF Input Sanitization (reject HTML, JS, XSS, malformed unicode)
    if (!validateSafePayload(body)) {
      AuditLogger.log({
        event: "VALIDATION_FAILED",
        username,
        ip,
        userAgent,
        details: { reason: "Security WAF validation failed. Malicious strings detected." },
      });
      return jsonError("SECURITY_VIOLATION", "Payload contains forbidden HTML/JS/XSS characters.", 400);
    }

    // 5. Zod schema validation
    const parseResult = placeSchema.safeParse(body);
    if (!parseResult.success) {
      AuditLogger.log({
        event: "VALIDATION_FAILED",
        username,
        ip,
        userAgent,
        details: { errors: parseResult.error.format() },
      });
      return jsonError("VALIDATION_ERROR", "Validation failed. Check your inputs.", 400, parseResult.error.format());
    }

    // 6. Execute submission via Service and Repository layers
    const repository = new GoogleSheetsPlaceRepository();
    const service = new PlaceSubmissionService(repository);

    const result = await service.submit(
      parseResult.data,
      { username, badge },
      { ip, userAgent }
    );

    AuditLogger.log({
      event: "SUBMISSION_SUCCESS",
      username,
      ip,
      userAgent,
      submissionId: result.submissionId,
    });

    return jsonSuccess("Place submitted successfully.", result.submissionId, 201);
  } catch (error) {
    AuditLogger.log({
      event: "SUBMISSION_FAILED",
      username,
      ip,
      userAgent,
      details: { errorRaw: String(error) },
    });
    return jsonError("INTERNAL_ERROR", "An internal error occurred while processing submission.", 500);
  }
}
