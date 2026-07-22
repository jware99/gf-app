import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/**
 * Every API route returns errors in this one shape, so the UI has a single
 * error-handling path rather than one per route (spec §8).
 */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export function apiError(
  status: number,
  code: string,
  message: string,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function validationError(zodError: ZodError): NextResponse<ApiErrorBody> {
  const message = zodError.issues.map((issue) => issue.message).join(" ");
  return apiError(400, "VALIDATION_ERROR", message || "Invalid request.");
}

export function notFoundError(message: string): NextResponse<ApiErrorBody> {
  return apiError(404, "NOT_FOUND", message);
}

export function unauthorizedError(): NextResponse<ApiErrorBody> {
  return apiError(401, "UNAUTHORIZED", "You must be signed in to do that.");
}

export function rateLimitedError(): NextResponse<ApiErrorBody> {
  return apiError(
    429,
    "RATE_LIMITED",
    "Too many requests. Please wait a moment and try again.",
  );
}

export function internalError(message = "Something went wrong."): NextResponse<ApiErrorBody> {
  return apiError(500, "INTERNAL_ERROR", message);
}
