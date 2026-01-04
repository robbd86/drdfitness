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
  const res = await fetch(input, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      // Ensure JSON by default for API calls
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
    },
  });

  const body = await parseResponseBody(res);

  if (!res.ok) {
    // Prefer server-provided message if available
    const message =
      typeof body === "object" && body && "message" in body && typeof (body as any).message === "string"
        ? (body as any).message
        : `Request failed (${res.status})`;

    throw new ApiError(message, res.status, body);
  }

  // If caller expects no body (e.g. DELETE), allow undefined
  if (schema) {
    return schema.parse(body);
  }

  return body as T;
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
