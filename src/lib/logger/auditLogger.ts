import { Logger } from "./index";

export interface AuditLogParams {
  event:
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "LOGOUT"
    | "SUBMISSION_SUCCESS"
    | "SUBMISSION_FAILED"
    | "VALIDATION_FAILED"
    | "RATE_LIMIT_EXCEEDED"
    | "AUTH_FAILED";
  username: string;
  ip: string;
  userAgent: string;
  submissionId?: string;
  details?: Record<string, unknown>;
}

export class AuditLogger {
  /**
   * Logs a security or user audit event.
   * Ensures passwords and secrets are never logged.
   */
  public static log(params: AuditLogParams): void {
    const timestamp = new Date().toISOString();
    
    // Sanitize any potential sensitive details
    const sanitizedDetails = params.details ? { ...params.details } : {};
    if (sanitizedDetails.password) delete sanitizedDetails.password;
    if (sanitizedDetails.secret) delete sanitizedDetails.secret;
    if (sanitizedDetails.token) delete sanitizedDetails.token;

    const context = {
      timestamp,
      event: params.event,
      username: params.username,
      ip: params.ip,
      userAgent: params.userAgent,
      ...(params.submissionId && { submissionId: params.submissionId }),
      details: sanitizedDetails,
    };

    const logMessage = `AUDIT EVENT: ${params.event} | User: ${params.username || "Anonymous"} | IP: ${params.ip}`;

    if (params.event.endsWith("_FAILED") || params.event === "RATE_LIMIT_EXCEEDED" || params.event === "AUTH_FAILED") {
      Logger.warn(logMessage, context);
    } else {
      Logger.info(logMessage, context);
    }
  }
}
