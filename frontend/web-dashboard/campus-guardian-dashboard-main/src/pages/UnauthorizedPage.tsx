import { Shield, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const requiredRoles = location.state?.requiredRoles as string[] | undefined;
  const attemptedPath = location.state?.attemptedPath as string | undefined;

  const roleLabel =
    user?.role === "student"
      ? "student"
      : user?.role === "security"
      ? "security staff"
      : user?.role === "admin"
      ? "administrator"
      : "user";

  const message = requiredRoles?.length
    ? `You are signed in as ${roleLabel}, but this page is restricted to ${requiredRoles.join(
        " or "
      )} users.`
    : `You are signed in as ${roleLabel}, but you do not have permission to access this page.`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center animate-fade-in max-w-md">
        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />

        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>

        <p className="text-muted-foreground mb-2">{message}</p>

        {attemptedPath && (
          <p className="text-xs text-muted-foreground mb-6">
            Requested page: <span className="font-medium">{attemptedPath}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>

          <Button onClick={() => navigate("/dashboard")}>
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}