import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "../components/PasswordInput";
import { LoadingButton } from "../components/LoadingButton";
import { useAuth } from "@/context/AuthContext";

export default function Register() {
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false, confirmPassword: false });
  const [errors, setErrors] = useState({ email: "", password: "", confirmPassword: "" });

  const validateEmail = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email";
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    return "";
  };

  const validateConfirmPassword = (value: string, passwordValue: string): string => {
    if (!value) return "Confirm your password";
    if (value !== passwordValue) return "Passwords do not match";
    return "";
  };

  const validateAll = () => {
    return {
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    };
  };

  const handleBlur = (field: "email" | "password" | "confirmPassword") => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const message =
      field === "email"
        ? validateEmail(email)
        : field === "password"
          ? validatePassword(password)
          : validateConfirmPassword(confirmPassword, password);

    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const currentValidation = useMemo(() => validateAll(), [email, password, confirmPassword]);
  const canSubmit = Object.values(currentValidation).every((message) => !message) && !isLoading;

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

    const nextErrors = validateAll();
    const hasErrors = Object.values(nextErrors).some((message) => Boolean(message));
    if (hasErrors) {
      setTouched({ email: true, password: true, confirmPassword: true });
      setErrors(nextErrors);
      return;
    }

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

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur("email")}
                placeholder="you@example.com"
                aria-invalid={touched.email && Boolean(errors.email)}
                aria-describedby={touched.email && errors.email ? "register-email-error" : undefined}
                disabled={isLoading}
              />
              {touched.email && errors.email && (
                <p id="register-email-error" role="alert" className="mt-1 text-sm text-destructive">
                  {errors.email}
                </p>
              )}
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
                onBlur={() => handleBlur("password")}
                className=""
                placeholder="••••••••"
                ariaInvalid={touched.password && Boolean(errors.password)}
                ariaDescribedBy={touched.password && errors.password ? "register-password-error" : undefined}
                disabled={isLoading}
              />
              {touched.password && errors.password && (
                <p id="register-password-error" role="alert" className="mt-1 text-sm text-destructive">
                  {errors.password}
                </p>
              )}
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
                onBlur={() => handleBlur("confirmPassword")}
                className=""
                placeholder="••••••••"
                ariaInvalid={touched.confirmPassword && Boolean(errors.confirmPassword)}
                ariaDescribedBy={
                  touched.confirmPassword && errors.confirmPassword ? "register-confirm-password-error" : undefined
                }
                disabled={isLoading}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p
                  id="register-confirm-password-error"
                  role="alert"
                  className="mt-1 text-sm text-destructive"
                >
                  {errors.confirmPassword}
                </p>
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
