import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit, validateSafePayload } from "@/lib/security";
import { placeSchema } from "@/schemas/placeSchema";
import { getPlaceRepository } from "@/lib/repositories/getPlaceRepository";
import { PlaceSubmissionService } from "@/lib/services/placeSubmissionService";
import { Logger } from "@/lib/logger";
import { AuditLogger } from "@/lib/logger/auditLogger";
import { jsonError, jsonSuccess } from "@/lib/utils/response";
import { checkPlaceUniqueness } from "@/lib/utils/uniqueness";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || "unknown";

  // Content-Type validation
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    return jsonError("BAD_REQUEST", "Unsupported Content-Type. Please use application/json.", 400);
  }

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

    let body: any;
    try {
      body = JSON.parse(bodyText);
    } catch (parseErr) {
      return jsonError("BAD_REQUEST", "Invalid JSON format.", 400);
    }

    // 4. WAF Input Sanitization (reject HTML, JS, XSS, malformed unicode, CSV injection)
    if (!validateSafePayload(body)) {
      AuditLogger.log({
        event: "VALIDATION_FAILED",
        username,
        ip,
        userAgent,
        details: { reason: "Security WAF validation failed. Malicious strings detected." },
      });
      return jsonError("SECURITY_VIOLATION", "Payload contains forbidden or malicious content.", 400);
    }

    // 5. Zod schema validation
    const parseResult = placeSchema.safeParse(body);
    if (!parseResult.success) {
      AuditLogger.log({
        event: "VALIDATION_FAILED",
        username,
        ip,
        userAgent,
        details: { errors: "Schema validation failed." },
      });
      const formattedErrors = parseResult.error.flatten().fieldErrors;
      return jsonError("VALIDATION_ERROR", "Validation failed. Check your inputs.", 400, formattedErrors);
    }

    // 6. Execute submission via Service and Repository layers
    const repository = getPlaceRepository();

    // Check uniqueness (Name, Area, State, Coordinates similarity check)
    const existingPlaces = await repository.findAll();
    const uniquenessResult = checkPlaceUniqueness(
      {
        placeName: parseResult.data.placeName,
        area: parseResult.data.area,
        state: parseResult.data.state,
        latitude: parseResult.data.latitude,
        longitude: parseResult.data.longitude,
      },
      existingPlaces
    );

    const forceSubmit = request.nextUrl.searchParams.get("force") === "true";

    if (uniquenessResult.status === "DUPLICATE") {
      AuditLogger.log({
        event: "VALIDATION_FAILED",
        username,
        ip,
        userAgent,
        details: { reason: "Duplicate place submission blocked.", message: uniquenessResult.message },
      });
      return jsonError("DUPLICATE_PLACE", uniquenessResult.message || "This place matches an existing entry too closely.", 400);
    }

    if (uniquenessResult.status === "SIMILAR" && !forceSubmit) {
      AuditLogger.log({
        event: "VALIDATION_FAILED",
        username,
        ip,
        userAgent,
        details: { reason: "Similar place warning triggered.", message: uniquenessResult.message },
      });
      return jsonError("SIMILAR_PLACE_WARNING", uniquenessResult.message || "A similar place was found. Please review.", 400);
    }

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
    const errMsg = error instanceof Error ? error.message : String(error);
    AuditLogger.log({
      event: "SUBMISSION_FAILED",
      username,
      ip,
      userAgent,
      details: { errorRaw: errMsg },
    });
    return jsonError("INTERNAL_ERROR", errMsg || "An internal error occurred while processing submission.", 500);
  }
}

export async function GET() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PUT() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function DELETE() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PATCH() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function HEAD() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function OPTIONS() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
