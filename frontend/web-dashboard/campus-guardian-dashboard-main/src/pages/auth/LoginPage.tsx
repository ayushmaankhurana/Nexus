import { useState } from "react";
import { useNavigate, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Shield, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message as string | undefined;

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const getFriendlyError = (err: unknown) => {
    if (err instanceof Error) {
      const msg = err.message.toLowerCase();

      if (msg.includes("suspended")) {
        return "Your account is suspended. Please contact the campus administrator.";
      }

      if (msg.includes("invalid") || msg.includes("unauthorized")) {
        return "Invalid email/username or password. Please check your details.";
      }

      if (msg.includes("network") || msg.includes("fetch")) {
        return "Unable to connect to the server. Please try again.";
      }

      return err.message;
    }

    return "Login failed. Please try again.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(identifier, password);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-4">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">NEXUS</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified Campus Security System
          </p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Sign in to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access the platform
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {successMessage && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  {successMessage}
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier">Email or Username</Label>
                <Input
                  id="identifier"
                  placeholder="you@campus.edu"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Sign in
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                New account?{" "}
                <Link to="/activate" className="text-primary hover:underline">
                  Activate here
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}