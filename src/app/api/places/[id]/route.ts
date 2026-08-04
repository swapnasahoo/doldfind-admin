import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit, validateSafePayload } from "@/lib/security";
import { placeSchema } from "@/schemas/placeSchema";
import { getPlaceRepository } from "@/lib/repositories/getPlaceRepository";
import { parseIncomingPayload } from "@/lib/parser";
import { Logger } from "@/lib/logger";
import { AuditLogger } from "@/lib/logger/auditLogger";
import { jsonError, jsonSuccess } from "@/lib/utils/response";
import { PlaceDetails } from "@/types/place";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
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
      details: { action: "update_place", placeId: id, reason: "Missing active session" },
    });
    return jsonError("UNAUTHORIZED", "Unauthenticated. Please log in first.", 401);
  }

  const username = session.username;
  const badge = session.badge;

  // 2. Rate Limiting protection
  const isAllowed = checkRateLimit(ip, `update_place_${id}`, 20, 60 * 1000); // 20 updates per minute
  if (!isAllowed) {
    AuditLogger.log({
      event: "RATE_LIMIT_EXCEEDED",
      username,
      ip,
      userAgent,
      details: { action: "update_place", placeId: id },
    });
    return jsonError("RATE_LIMIT", "Too many updates. Please wait.", 429);
  }

  try {
    // 3. Size limit check
    const bodyText = await request.text();
    if (bodyText.length > 50000) { // Limit to 50KB payload
      Logger.warn(`Suspiciously large place update payload rejected from user: ${username}`);
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
        details: { reason: "Security WAF validation failed on update. Malicious strings detected." },
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
        placeId: id,
        details: { errors: "Schema validation failed." },
      });
      const formattedErrors = parseResult.error.flatten().fieldErrors;
      return jsonError("VALIDATION_ERROR", "Validation failed. Check your inputs.", 400, formattedErrors);
    }

    // 6. Normalize the update payload
    const parsed = parseIncomingPayload(parseResult.data);

    const repository = getPlaceRepository();

    const updatedDetails: PlaceDetails = {
      id,
      placeName: parsed.placeName,
      description: parsed.description,
      placeType: parsed.placeType,
      mainCategory: parsed.mainCategory,
      categories: parsed.categories,
      images: parsed.images,
      city: parsed.city,
      area: parsed.area,
      state: parsed.state,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      bestTimings: parsed.bestTimings,
      closedOn: parsed.closedOn,
      nearestMetro: parsed.nearestMetro,
      crowdLevel: parsed.crowdLevel,
      safetyNote: parsed.safetyNote,
      entryFee: parsed.entryFee,
      likes: String(body.likes ?? "0"),
      saves: String(body.saves ?? "0"),
      visited: String(body.visited ?? "0"),
      uploaderId: username,
      uploaderBadge: badge,
    };

    // 7. Persist update in repository
    await repository.update(id, updatedDetails);

    AuditLogger.log({
      event: "PLACE_EDITED",
      username,
      badge,
      ip,
      userAgent,
      placeId: id,
    });

    return jsonSuccess("Place updated successfully.", id, 200);
  } catch (error) {
    Logger.error(`Failed to update place ${id}:`, error);
    return jsonError("INTERNAL_ERROR", "An internal error occurred while updating the place.", 500);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
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
      details: { action: "delete_place", placeId: id, reason: "Missing active session" },
    });
    return jsonError("UNAUTHORIZED", "Unauthenticated. Please log in first.", 401);
  }

  const username = session.username;
  const badge = session.badge;

  // 2. Rate Limiting protection
  const isAllowed = checkRateLimit(ip, `delete_place_${id}`, 10, 60 * 1000); // 10 deletes per minute
  if (!isAllowed) {
    AuditLogger.log({
      event: "RATE_LIMIT_EXCEEDED",
      username,
      ip,
      userAgent,
      details: { action: "delete_place", placeId: id },
    });
    return jsonError("RATE_LIMIT", "Too many delete requests. Please wait.", 429);
  }

  try {
    const repository = getPlaceRepository();
    await repository.delete(id);

    AuditLogger.log({
      event: "PLACE_DELETED",
      username,
      badge,
      ip,
      userAgent,
      placeId: id,
    });

    return jsonSuccess("Place deleted successfully.", id, 200);
  } catch (error) {
    Logger.error(`Failed to delete place ${id}:`, error);
    return jsonError("INTERNAL_ERROR", "An internal error occurred while deleting the place.", 500);
  }
}

export async function GET() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function POST() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PATCH() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function HEAD() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function OPTIONS() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
