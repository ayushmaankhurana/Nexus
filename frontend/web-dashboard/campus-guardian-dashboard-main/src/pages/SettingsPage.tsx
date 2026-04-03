import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { mockSession } from "@/mocks/data";
import { LogOut, Smartphone, Shield, Palette } from "lucide-react";
import { getDisplayName, getUserInitials } from "@/lib/utils";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account preferences and security." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Profile" actions={<Button variant="outline" size="sm" disabled>Edit</Button>}>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-lg font-semibold">
                {getUserInitials(user)}
              </div>
              <div>
                <p className="font-medium">{getDisplayName(user)}</p>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div><span className="text-muted-foreground text-xs block">Role</span><StatusBadge variant="default">{user?.role}</StatusBadge></div>
              <div><span className="text-muted-foreground text-xs block">Department</span>{user?.department || "—"}</div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Appearance">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">Toggle between light and dark mode</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </SectionCard>

        <SectionCard title="Security">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div><p className="text-sm font-medium">Password</p><p className="text-xs text-muted-foreground">Last changed 30 days ago</p></div>
              </div>
              <Button variant="outline" size="sm" disabled>Change</Button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Active Session">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">{mockSession.deviceName}</p>
              <p className="text-xs text-muted-foreground capitalize">{mockSession.deviceType} • {mockSession.ipAddress}</p>
            </div>
            <StatusBadge variant="active">Active</StatusBadge>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-xs text-muted-foreground">End your current session</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" />Sign out
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
