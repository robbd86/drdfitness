import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "../components/LoadingButton";
import { PasswordInput } from "../components/PasswordInput";
import * as authApi from "@/lib/auth";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [, setLocation] = useLocation();
  const { refresh } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({ email: "", password: "" });

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

  const handleBlur = (field: "email" | "password") => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const message = field === "email" ? validateEmail(email) : validatePassword(password);
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setTouched({ email: true, password: true });
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsLoading(true);
    try {
      await authApi.login(email, password);
      await refresh();
      setLocation("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-sm">
          <h1 className="text-2xl font-bold font-display mb-2">Login</h1>
          <p className="text-sm text-muted-foreground mb-6">Sign in to access your workouts.</p>

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
                aria-describedby={touched.email && errors.email ? "email-error" : undefined}
                disabled={isLoading}
              />
              {touched.email && errors.email && (
                <p id="email-error" role="alert" className="mt-1 text-sm text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur("password")}
                className=""
                placeholder="••••••••"
                ariaInvalid={touched.password && Boolean(errors.password)}
                ariaDescribedBy={touched.password && errors.password ? "password-error" : undefined}
                disabled={isLoading}
              />
              {touched.password && errors.password && (
                <p id="password-error" role="alert" className="mt-1 text-sm text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-slate-700 bg-slate-900 text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-background"
                />
                Remember me
              </label>

              <Link href="/forgot-password" className="text-sm text-orange-500 hover:text-orange-400">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <LoadingButton
              type="submit"
              className="w-full font-bold gradient-primary"
              isLoading={isLoading}
              loadingText="Signing in..."
            >
              Sign in
            </LoadingButton>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-orange-500 hover:opacity-80 transition-opacity"
            >
              Create one
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
