import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, SectionCard } from "@/components/shared/PageComponents";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { mockSession } from "@/mocks/data";
import { User, Smartphone, Monitor, LogOut, RefreshCw } from "lucide-react";

export default function StudentAccount() {
  const { user, logout, switchDevice } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader title="My Account" description="Manage your profile and device settings." />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Profile Information" actions={<Button variant="outline" size="sm" disabled>Edit Profile</Button>}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold">
                {user?.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <h3 className="font-medium">{user?.name}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground block text-xs mb-0.5">Student ID</span>{user?.studentId || "—"}</div>
              <div><span className="text-muted-foreground block text-xs mb-0.5">Department</span>{user?.department || "—"}</div>
              <div><span className="text-muted-foreground block text-xs mb-0.5">Status</span><StatusBadge variant={user?.status as any}>{user?.status}</StatusBadge></div>
              <div><span className="text-muted-foreground block text-xs mb-0.5">Role</span><StatusBadge variant="default">{user?.role}</StatusBadge></div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Active Session" actions={
          <Button variant="outline" size="sm" onClick={() => switchDevice("new-device")} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />Switch Device
          </Button>
        }>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{mockSession.deviceName}</p>
                <p className="text-xs text-muted-foreground capitalize">{mockSession.deviceType} • {mockSession.ipAddress}</p>
              </div>
              <StatusBadge variant="active">Active</StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-muted-foreground block text-xs mb-0.5">Last Active</span>{new Date(mockSession.lastActive).toLocaleString()}</div>
              <div><span className="text-muted-foreground block text-xs mb-0.5">Session Started</span>{new Date(mockSession.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Security">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sign out of this session</p>
            <p className="text-xs text-muted-foreground">You will be redirected to the login page</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" />Sign out
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
