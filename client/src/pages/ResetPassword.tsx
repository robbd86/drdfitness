import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { PasswordInput } from "@/components/PasswordInput";
import { LoadingButton } from "@/components/LoadingButton";
import { resetPassword } from "@/lib/auth";

export default function ResetPassword() {
  const [location, setLocation] = useLocation();

  const token = useMemo(() => {
    const queryIndex = location.indexOf("?");
    if (queryIndex === -1) return "";
    const params = new URLSearchParams(location.slice(queryIndex + 1));
    return params.get("token") || "";
  }, [location]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [touched, setTouched] = useState({ password: false, confirmPassword: false });
  const [errors, setErrors] = useState({ password: "", confirmPassword: "" });

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
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(confirmPassword, password),
    };
  };

  const handleBlur = (field: "password" | "confirmPassword") => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    const message =
      field === "password"
        ? validatePassword(password)
        : validateConfirmPassword(confirmPassword, password);

    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => setLocation("/login"), 2500);
    return () => clearTimeout(timer);
  }, [successMessage, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!token) {
      setFormError("Missing reset token. Please request a new reset link.");
      return;
    }

    const nextErrors = validateAll();
    const hasErrors = Object.values(nextErrors).some((message) => Boolean(message));
    if (hasErrors) {
      setTouched({ password: true, confirmPassword: true });
      setErrors(nextErrors);
      return;
    }

    setIsLoading(true);
    try {
      const msg = await resetPassword(token, password);
      setSuccessMessage(msg || "Password reset successful");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const tokenMissing = !token;

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-sm">
          <h1 className="text-2xl font-bold font-display mb-2">Choose a new password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter a new password for your account.
          </p>

          {tokenMissing && !successMessage ? (
            <div className="space-y-4">
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2" role="alert">
                Missing reset token. Please request a new reset link.
              </div>
              <Link href="/forgot-password" className="font-bold text-orange-500 hover:opacity-80 transition-opacity">
                Go to forgot password
              </Link>
            </div>
          ) : null}

          {!successMessage ? (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="text-sm font-medium">New password</label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur("password")}
                  placeholder="••••••••"
                  ariaInvalid={touched.password && Boolean(errors.password)}
                  ariaDescribedBy={touched.password && errors.password ? "reset-password-error" : undefined}
                  disabled={isLoading}
                />
                {touched.password && errors.password && (
                  <p id="reset-password-error" role="alert" className="mt-1 text-sm text-destructive">
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
                  placeholder="••••••••"
                  ariaInvalid={touched.confirmPassword && Boolean(errors.confirmPassword)}
                  ariaDescribedBy={
                    touched.confirmPassword && errors.confirmPassword ? "reset-confirm-password-error" : undefined
                  }
                  disabled={isLoading}
                />
                {touched.confirmPassword && errors.confirmPassword && (
                  <p id="reset-confirm-password-error" role="alert" className="mt-1 text-sm text-destructive">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {formError && (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2" role="alert">
                  {formError}
                </div>
              )}

              <LoadingButton
                type="submit"
                className="w-full font-bold gradient-primary"
                isLoading={isLoading}
                loadingText="Resetting..."
                disabled={isLoading || tokenMissing}
              >
                Reset password
              </LoadingButton>

              <div className="text-center text-sm text-muted-foreground">
                <Link href="/login" className="font-bold text-orange-500 hover:opacity-80 transition-opacity">
                  Back to login
                </Link>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2" role="status">
                {successMessage}
              </div>
              <p className="text-sm text-muted-foreground">Redirecting you to login…</p>
              <Link href="/login" className="font-bold text-orange-500 hover:opacity-80 transition-opacity">
                Go to login now
              </Link>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
