import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useLocation } from "react-router-dom";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/attendance": "My Attendance",
  "/access": "Access Status",
  "/alerts": "My Alerts",
  "/account": "My Account",
  "/support": "Report an Issue",
  "/settings": "Settings",
  "/admin/students": "Students",
  "/admin/attendance": "Attendance Monitoring",
  "/admin/access": "Access Control",
  "/admin/incidents": "Incidents",
  "/admin/presence": "Presence Intelligence",
  "/admin/alerts": "Alerts",
  "/admin/activity": "Activity Log",
};

export function AppHeader() {
  const { user } = useAuth();
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] || "NEXUS";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="h-8 w-8" />

      <div className="flex-1 flex items-center gap-4">
        <h2 className="text-sm font-semibold hidden sm:block">{pageTitle}</h2>
        <div className="relative hidden md:block max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-9 h-8 text-sm bg-muted/50 border-0" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
        </Button>
        <div className="hidden sm:flex items-center gap-2 ml-2 pl-2 border-l">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
            {user?.name.split(" ").map(n => n[0]).join("") || "U"}
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <StatusBadge variant={user?.role === "admin" ? "info" : "default"} className="text-[10px] px-1.5 py-0 mt-0.5">
              {user?.role}
            </StatusBadge>
          </div>
        </div>
      </div>
    </header>
  );
}
