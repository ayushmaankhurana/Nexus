import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "@/services/authApi";
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
import { AlertCircle, CheckCircle2, Loader2, Shield } from "lucide-react";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [devResetToken, setDevResetToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError("");
    setMessage("");
    setDevResetToken("");
    setLoading(true);

    try {
      const res = await authApi.forgotPassword(identifier);

      setMessage(
        res.message ||
          "If an account exists, password reset instructions have been generated."
      );

      if (res.resetToken) {
        setDevResetToken(res.resetToken);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to send reset request.";
      setError(msg);
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
          <h1 className="text-2xl font-semibold tracking-tight">Forgot Password</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Request a secure password reset
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reset your password</CardTitle>
            <CardDescription>
              Enter your email, username, or student ID.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {message && (
                <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{message}</p>

                    {devResetToken && (
                      <div className="mt-3 rounded-md bg-white border p-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Dev reset token:
                        </p>
                        <code className="text-xs break-all">{devResetToken}</code>
                        <Link
                          to={`/reset-password?token=${encodeURIComponent(
                            devResetToken
                          )}`}
                          className="block mt-2 text-primary hover:underline text-xs"
                        >
                          Continue to reset password
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="identifier">Email / Username / Student ID</Label>
                <Input
                  id="identifier"
                  placeholder="you@campus.edu"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Send reset request
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Remembered your password?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}