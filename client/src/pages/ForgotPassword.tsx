import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "../components/LoadingButton";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email";
    return "";
  };

  const emailError = useMemo(() => validateEmail(email), [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const trimmed = email.trim();
    const nextEmailError = validateEmail(trimmed);
    if (nextEmailError) {
      setError(nextEmailError);
      return;
    }

    try {
      setIsLoading(true);
      const msg = await requestPasswordReset(trimmed);
      setMessage(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request password reset");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card className="p-6 border-border/40 bg-card/30 backdrop-blur-sm">
          <h1 className="text-2xl font-bold font-display mb-2">Reset Password</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

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
                placeholder="you@example.com"
                disabled={isLoading}
              />
            </div>

            {message && (
              <div className="text-sm text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-3 py-2" role="status">
                {message}
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2" role="alert">
                {error}
              </div>
            )}

            <LoadingButton
              type="submit"
              className="w-full font-bold gradient-primary"
              isLoading={isLoading}
              loadingText="Sending..."
              disabled={Boolean(emailError) || isLoading}
            >
              Send Reset Link
            </LoadingButton>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-bold text-orange-500 hover:opacity-80 transition-opacity">
              Back to login
            </Link>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
