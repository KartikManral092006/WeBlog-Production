"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { authAPI } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "login" | "register";
}

export function AuthModal({
  open,
  onOpenChange,
  initialTab = "login",
}: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<"login" | "register">(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(false);

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setError("");
      setStaySignedIn(false);
    }
  }, [initialTab, open]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(loginEmail, loginPassword, staySignedIn);
      onOpenChange(false);
      setLoginEmail("");
      setLoginPassword("");
      setStaySignedIn(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(regName, regEmail, regPassword);
      onOpenChange(false);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError("");
    setLoading(true);
    window.location.assign(authAPI.googleLoginUrl());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border/60 bg-background p-0 shadow-2xl sm:max-w-4xl sm:rounded-2xl">
        <div className="grid md:grid-cols-[1.1fr_1fr]">
          <aside className="relative hidden min-h-155 overflow-hidden bg-primary/95 md:block">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=1200&auto=format&fit=crop')" }}
            />
            <div className="absolute inset-0 bg-linear-to-b from-primary/70 via-primary/75 to-primary/90" />
            <div className="absolute bottom-0 left-0 right-0 p-10 text-primary-foreground">
              <div className="group relative inline-flex items-end gap-1 pb-1">
                <span className="font-heading text-6xl leading-none tracking-tight text-primary-foreground">
                  We
                </span>
                <span className="text-sm font-semibold uppercase tracking-[0.22em] text-primary-foreground/90">
                  Blog
                </span>
                <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-linear-to-r from-primary-foreground/0 via-primary-foreground/80 to-primary-foreground/0 opacity-90" />
              </div>
              <p className="mt-5 max-w-sm text-lg text-primary-foreground/80">
                A curated haven for the thoughtful reader. Rediscover the art of long-form storytelling.
              </p>
            </div>
          </aside>

          <div className="p-6 md:p-10">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-heading text-5xl tracking-tight">Welcome back</DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Please enter your credentials to access your library.
              </DialogDescription>
            </DialogHeader>

            <Tabs value={tab} onValueChange={(v) => { setTab(v as "login" | "register"); setError(""); }}>
              <TabsList className="mb-5 grid h-11 w-full grid-cols-2 rounded-full bg-muted/70 p-1">
                <TabsTrigger value="login" className="rounded-full text-base font-semibold data-active:bg-background data-active:shadow-sm">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-full text-base font-semibold data-active:bg-background data-active:shadow-sm">
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Email Address</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="reader@editorialmuse.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-12 rounded-lg border-border/60 bg-muted/45 px-4"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Password</Label>
                      <button type="button" className="text-xs font-medium text-primary/80 hover:text-primary">Forgot Password?</button>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="h-12 rounded-lg border-border/60 bg-muted/45 px-4"
                      required
                    />
                  </div>

                  <label className="flex items-center gap-3 text-sm text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={staySignedIn}
                      onChange={(e) => setStaySignedIn(e.target.checked)}
                      className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-2 focus:ring-ring"
                    />
                    Stay signed in for 30 days
                  </label>

                  {error && (
                    <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}

                  <Button type="submit" className="h-12 w-full rounded-lg bg-primary text-base text-primary-foreground hover:bg-primary/90" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                  </Button>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/70" />
                    </div>
                    <p className="relative mx-auto w-fit bg-background px-3 text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Or continue with
                    </p>
                  </div>

                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full rounded-lg"
                      onClick={handleGoogleLogin}
                      disabled={loading}
                    >
                      <span className="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-sm font-bold text-[#4285f4]">
                        G
                      </span>
                      Google
                    </Button>
                  </div>

                  <p className="text-center text-sm text-muted-foreground">
                    New to the journal?{" "}
                    <button type="button" className="font-semibold text-primary hover:text-primary/80" onClick={() => setTab("register")}>Join our circle</button>
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Full Name</Label>
                    <Input
                      id="reg-name"
                      placeholder="John Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="h-12 rounded-lg border-border/60 bg-muted/45 px-4"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Email Address</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="reader@editorialmuse.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="h-12 rounded-lg border-border/60 bg-muted/45 px-4"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Password</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="••••••••"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="h-12 rounded-lg border-border/60 bg-muted/45 px-4"
                      required
                      minLength={6}
                    />
                  </div>
                  {error && (
                    <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="h-12 w-full rounded-lg bg-primary text-base text-primary-foreground hover:bg-primary/90" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
