// Schema validation helpers for safer request parsing at API boundaries.
import { z } from "zod";
import { ApiError } from "./apiError";

export function parseOrThrow<T>(schema: z.ZodType<T>, payload: unknown): T {
  const result = schema.safeParse(payload);
  if (!result.success) {
    throw new ApiError(400, result.error.issues[0]?.message ?? "Invalid request payload");
  }
  return result.data;
}
