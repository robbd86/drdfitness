type SafeUser = {
  id: string;
  email: string;
  createdAt: string | Date;
};

type AuthResponse = {
  user: SafeUser;
};

type MeResponse = {
  user: SafeUser | null;
};

function apiBase(): string {
  const base = (import.meta as any).env?.VITE_API_URL as string | undefined;
  return (base || "").replace(/\/$/, "");
}

function url(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const base = apiBase();
  if (!base) return path;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => undefined);
  }
  return res.text().catch(() => undefined);
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(url(path), {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });

  const body = await parseBody(res);

  if (!res.ok) {
    const serverMessage =
      typeof body === "object" && body && "message" in body && typeof (body as any).message === "string"
        ? (body as any).message
        : undefined;
    const message = serverMessage ? `${serverMessage} (${res.status})` : `Request failed (${res.status})`;
    throw new Error(message);
  }

  return body as T;
}

export async function register(email: string, password: string): Promise<SafeUser> {
  const data = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function login(email: string, password: string): Promise<SafeUser> {
  const data = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

export async function logout(): Promise<void> {
  await request<void>("/api/auth/logout", { method: "POST" });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const res = await fetch(url("/api/auth/me"), {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  });

  if (res.status === 401) return null;

  const body = await parseBody(res);

  if (!res.ok) {
    const serverMessage =
      typeof body === "object" && body && "message" in body && typeof (body as any).message === "string"
        ? (body as any).message
        : undefined;
    const message = serverMessage ? `${serverMessage} (${res.status})` : `Request failed (${res.status})`;
    throw new Error(message);
  }

  const data = body as MeResponse;
  return data.user;
}

// Backwards-compatible alias for older code.
export async function getMe(): Promise<SafeUser | null> {
  return getCurrentUser();
}
