"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface AuthFormProps {
  onAuth: (
    mode: "login" | "signup",
    username: string,
    password: string,
  ) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function AuthForm({ onAuth, loading, error }: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onAuth(mode, username, password);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/5 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Chess piece decorative element */}
        <div className="animate-float mb-6 text-center">
          <span className="text-5xl opacity-60 select-none" style={{ filter: "drop-shadow(0 0 20px oklch(0.78 0.12 75 / 30%))" }}>
            ♚
          </span>
        </div>

        <Card className="glow-amber border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-xl tracking-tight text-foreground">
              {mode === "login" ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to continue playing"
                : "Join the game in seconds"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11 bg-background/50"
                  required
                  minLength={2}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-background/50"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-center text-sm text-destructive">{error}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full text-sm font-semibold"
                size="lg"
              >
                {loading ? (
                  <span className="animate-pulse-amber">Connecting...</span>
                ) : mode === "login" ? (
                  "Sign In"
                ) : (
                  "Create Account"
                )}
              </Button>

              <div className="pt-1 text-center text-sm text-muted-foreground">
                {mode === "login"
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-primary transition-colors hover:text-primary/80"
                >
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
