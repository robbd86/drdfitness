import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "../components/PasswordInput";
import { LoadingButton } from "../components/LoadingButton";
import { useAuth } from "@/context/AuthContext";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function Register() {
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fieldErrors = useMemo((): FieldErrors => {
    const errors: FieldErrors = {};

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Enter a valid email";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm your password";
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords do not match";
    }

    return errors;
  }, [email, password, confirmPassword]);

  const canSubmit = Object.keys(fieldErrors).length === 0 && !isLoading;

  const extractErrorMessage = (status: number, body: unknown): string => {
    const statusSuffix = `(${status})`;

    if (typeof body === "string" && body.trim()) {
      return `${body} ${statusSuffix}`;
    }

    if (typeof body === "object" && body) {
      const anyBody = body as any;
      if (typeof anyBody.message === "string" && anyBody.message.trim()) {
        // Surface per-field validation messages when present (Zod flatten format)
        const fieldErrorsObj = anyBody?.errors?.fieldErrors;
        if (fieldErrorsObj && typeof fieldErrorsObj === "object") {
          const details: string[] = [];
          for (const [field, messages] of Object.entries(fieldErrorsObj)) {
            if (Array.isArray(messages) && messages.length) {
              details.push(`${field}: ${messages.join(", ")}`);
            }
          }

          if (details.length) {
            return `${anyBody.message} — ${details.join(" · ")} ${statusSuffix}`;
          }
        }

        return `${anyBody.message} ${statusSuffix}`;
      }
    }

    return `Registration failed ${statusSuffix}`;
  };

  const registerWithFetch = async (email: string, password: string) => {
    const base = (import.meta as any).env?.VITE_API_URL as string | undefined;
    const trimmedBase = base ? String(base).replace(/\/$/, "") : "";
    const endpoint = trimmedBase ? `${trimmedBase}/auth/register` : "/auth/register";

    const res = await fetch(endpoint, {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const contentType = res.headers.get("content-type") || "";
    let body: unknown = undefined;
    try {
      body = contentType.includes("application/json") ? await res.json() : await res.text();
    } catch {
      body = undefined;
    }

    if (!res.ok) {
      throw new Error(extractErrorMessage(res.status, body));
    }

    return body;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canSubmit) return;

    setIsLoading(true);
    try {
      try {
        await registerWithFetch(email, password);
        await refresh();
        setLocation("/workouts");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Registration failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-sm">
          <h1 className="text-2xl font-bold font-display mb-2">Register</h1>
          <p className="text-sm text-muted-foreground mb-6">Create an account to save your workouts.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isLoading}
              />
              {fieldErrors.email && <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className=""
                placeholder="••••••••"
                disabled={isLoading}
              />
              {fieldErrors.password && <p className="mt-1 text-sm text-destructive">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Confirm password</label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className=""
                placeholder="••••••••"
                disabled={isLoading}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {formError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {formError}
              </div>
            )}

            <LoadingButton
              type="submit"
              className="w-full font-bold gradient-primary"
              isLoading={isLoading}
              loadingText="Creating account..."
              disabled={!canSubmit}
            >
              Create account
            </LoadingButton>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
