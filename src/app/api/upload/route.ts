import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/security";
import { AppwriteStorageService } from "@/lib/services/appwriteStorageService";
import { Logger } from "@/lib/logger";
import { AuditLogger } from "@/lib/logger/auditLogger";
import { jsonError, jsonSuccess } from "@/lib/utils/response";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

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
      details: { action: "upload_image", reason: "Missing active session" },
    });
    return jsonError("UNAUTHORIZED", "Unauthenticated. Please log in first.", 401);
  }

  const username = session.username;

  // 2. Rate Limiting protection
  const isAllowed = checkRateLimit(ip, "upload_image", 20, 60 * 1000); // 20 uploads per minute
  if (!isAllowed) {
    AuditLogger.log({
      event: "RATE_LIMIT_EXCEEDED",
      username,
      ip,
      userAgent,
      details: { action: "upload_image" },
    });
    return jsonError("RATE_LIMIT", "Too many file uploads. Please wait a minute.", 429);
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !(file instanceof File)) {
      return jsonError("BAD_REQUEST", "No valid image file provided in form data field 'file'.", 400);
    }

    // 3. File type validation
    if (!ALLOWED_MIME_TYPES.has(file.type.toLowerCase())) {
      return jsonError(
        "BAD_REQUEST",
        `Invalid file type '${file.type}'. Allowed types: JPEG, PNG, WEBP, GIF, AVIF, SVG.`,
        400
      );
    }

    // 4. File size validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonError("BAD_REQUEST", "File size limit exceeded (maximum 10MB allowed).", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload to Appwrite Cloud Storage Bucket
    const storageService = new AppwriteStorageService();
    const uploadResult = await storageService.uploadImage(buffer, file.name, file.type);

    AuditLogger.log({
      event: "FILE_UPLOADED",
      username,
      ip,
      userAgent,
      details: { fileName: file.name, size: file.size, fileId: uploadResult.fileId, url: uploadResult.url },
    });

    return jsonSuccess("Image uploaded successfully to Appwrite Bucket.", undefined, 201, uploadResult);
  } catch (error: any) {
    Logger.error("Failed to process image upload:", error?.message || error);
    return jsonError("INTERNAL_ERROR", error?.message || "An internal error occurred during file upload.", 500);
  }
}

export async function GET() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PUT() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function DELETE() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
export async function PATCH() { return jsonError("METHOD_NOT_ALLOWED", "Method not allowed.", 405); }
