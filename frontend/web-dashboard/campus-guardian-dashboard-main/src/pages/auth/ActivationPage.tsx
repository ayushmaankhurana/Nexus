import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, AlertCircle } from "lucide-react";

export default function ActivationPage() {
  const { activate } = useAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    try {
      await activate(token, password);
      navigate("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Activation failed.";
      setError(message);
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
          <h1 className="text-2xl font-semibold tracking-tight">Activate Account</h1>
          <p className="text-sm text-muted-foreground mt-1">Set up your NEXUS credentials</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Activation</CardTitle>
            <CardDescription>Enter the activation token from your welcome email</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="token">Activation Token</Label>
                <Input id="token" placeholder="Enter token" value={token} onChange={e => setToken(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirm Password</Label>
                <Input id="confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Activate Account
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Already activated?{" "}
                <a href="/login" className="text-primary hover:underline">Sign in</a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
