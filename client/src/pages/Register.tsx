import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as authApi from "@/lib/auth";
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
  const [submitting, setSubmitting] = useState(false);
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

  const canSubmit = Object.keys(fieldErrors).length === 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!canSubmit) return;

    setSubmitting(true);
    try {
      await authApi.register(email, password);
      await refresh();
      setLocation("/login");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
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
                disabled={submitting}
              />
              {fieldErrors.email && <p className="mt-1 text-sm text-destructive">{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
              />
              {fieldErrors.password && <p className="mt-1 text-sm text-destructive">{fieldErrors.password}</p>}
            </div>

            <div>
              <label className="text-sm font-medium">Confirm password</label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
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

            <Button type="submit" className="w-full font-bold gradient-primary" disabled={!canSubmit}>
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
