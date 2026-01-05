// client/src/lib/apiFetch.ts
import { ZodType } from "zod";

/**
 * Standardised API error so the UI can show useful feedback
 * instead of blank screens / silent failures.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Safely parse a Response body.
 * - Handles empty responses
 * - Handles non-JSON responses
 */
async function parseResponseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!text) return undefined;

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      // invalid JSON, fall through
    }
  }

  return text;
}

function withApiBase(input: RequestInfo | URL): RequestInfo | URL {
  const base = (import.meta as any).env?.VITE_API_URL as string | undefined;
  if (!base) return input;

  const trimmedBase = base.replace(/\/$/, "");

  if (typeof input === "string") {
    if (input.startsWith("http://") || input.startsWith("https://")) return input;
    if (input.startsWith("/")) return `${trimmedBase}${input}`;
    return input;
  }

  if (input instanceof URL) {
    // Only rewrite relative-ish URLs (no host). URL objects are typically absolute.
    return input;
  }

  // Request objects are left untouched.
  return input;
}

/**
 * Main fetch helper:
 * - throws ApiError on non-2xx
 * - optionally validates/parses response with Zod schema
 */
export async function apiFetch<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
  schema?: ZodType<T>
): Promise<T> {
  try {
    const response = await fetch(withApiBase(input), {
      ...init,
      headers: {
        ...(init?.headers || {}),
        // Ensure JSON by default for API calls
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });

    // Clone the response so React Query devtools can also read it
    const res = response.clone();
    const body = await parseResponseBody(res);

    if (!response.ok) {
      // Prefer server-provided message if available
      const message =
        typeof body === "object" && body && "message" in body && typeof (body as any).message === "string"
          ? (body as any).message
          : `Request failed (${response.status})`;

      throw new ApiError(message, response.status, body);
    }

    // If caller expects no body (e.g. DELETE), allow undefined
    if (schema) {
      return schema.parse(body);
    }

    return body as T;
  } catch (error) {
    // If it's already an ApiError, rethrow it
    if (error instanceof ApiError) {
      throw error;
    }
    // Otherwise, wrap it in an ApiError
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed",
      0,
      error
    );
  }
}

/**
 * Convenience helpers
 */
export function apiGet<T>(url: string, schema?: ZodType<T>) {
  return apiFetch<T>(url, { method: "GET" }, schema);
}

export function apiDelete<T>(url: string, schema?: ZodType<T>) {
  return apiFetch<T>(url, { method: "DELETE" }, schema);
}

export function apiPost<T>(url: string, data?: unknown, schema?: ZodType<T>) {
  return apiFetch<T>(
    url,
    {
      method: "POST",
      body: data === undefined ? undefined : JSON.stringify(data),
    },
    schema
  );
}

export function apiPatch<T>(url: string, data?: unknown, schema?: ZodType<T>) {
  return apiFetch<T>(
    url,
    {
      method: "PATCH",
      body: data === undefined ? undefined : JSON.stringify(data),
    },
    schema
  );
}
