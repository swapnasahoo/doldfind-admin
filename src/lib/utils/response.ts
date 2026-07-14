import { NextResponse } from "next/server";

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface SuccessResponse {
  success: true;
  submissionId?: string;
  message: string;
  data?: unknown;
}

/**
 * Standard utility to return structured JSON error responses.
 */
export function jsonError(code: string, message: string, status = 400, details?: unknown): NextResponse<ErrorResponse> {
  const body: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
    },
  };
  return NextResponse.json(body, { status });
}

/**
 * Standard utility to return structured JSON success responses.
 */
export function jsonSuccess(message: string, submissionId?: string, status = 200, data?: unknown): NextResponse<SuccessResponse> {
  const body: SuccessResponse = {
    success: true,
    message,
    ...(submissionId !== undefined && { submissionId }),
    ...(data !== undefined && { data }),
  };
  return NextResponse.json(body, { status });
}
