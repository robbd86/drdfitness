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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={submitting}
                disabled={isLoading}
              />
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
                className=""
                placeholder="••••••••"
                disabled={submitting}
                disabled={isLoading}
              />
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
