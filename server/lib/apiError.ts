// Shared API error helpers to keep response shape and status handling consistent.
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function getErrorMessage(error: unknown, fallback = "Internal Server Error") {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function getErrorStatus(error: unknown, fallback = 500) {
  if (error instanceof ApiError) {
    return error.status;
  }
  return fallback;
}
