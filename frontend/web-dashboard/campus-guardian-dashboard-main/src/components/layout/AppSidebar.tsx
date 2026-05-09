import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, CalendarCheck, DoorOpen, AlertTriangle, User, LifeBuoy, Settings,
  Users, Activity, ShieldAlert, MapPin, Radio, ClipboardList, LogOut, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { getDisplayName, getUserInitials } from "@/lib/utils";
import { isAdminRole, isFacultyRole, normalizeUserRole } from "@/types";

const studentNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "My Attendance", url: "/attendance", icon: CalendarCheck },
  { title: "Access Status", url: "/access", icon: DoorOpen },
  { title: "My Alerts", url: "/alerts", icon: AlertTriangle },
  { title: "My Account", url: "/account", icon: User },
  { title: "Report Issue", url: "/support", icon: LifeBuoy },
];

const adminNav = [
  { title: "Operations", url: "/dashboard", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Attendance", url: "/admin/attendance", icon: CalendarCheck },
  { title: "Access Control", url: "/admin/access", icon: DoorOpen },
  { title: "Incidents", url: "/admin/incidents", icon: ShieldAlert },
  { title: "Presence Intel", url: "/admin/presence", icon: MapPin },
  { title: "Alerts", url: "/admin/alerts", icon: AlertTriangle },
  { title: "Activity Log", url: "/admin/activity", icon: Radio },
];

const facultyNav = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Attendance", url: "/admin/attendance", icon: CalendarCheck },
  { title: "Presence Intel", url: "/admin/presence", icon: MapPin },
];

const sharedNav = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isAdmin = isAdminRole(user?.role);
  const isFaculty = isFacultyRole(user?.role);
  const navItems = isAdmin ? adminNav : isFaculty ? facultyNav : studentNav;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">NEXUS</span>
              <span className="text-[10px] text-muted-foreground leading-none">Campus Security</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">
            {isAdmin ? "Operations" : isFaculty ? "Faculty" : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">General</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sharedNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-2.5 mb-2 px-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
              {getUserInitials(user).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{getDisplayName(user)}</p>
              <div className="flex items-center gap-1.5">
                <StatusBadge variant={normalizeUserRole(user.role) === "ADMIN" ? "info" : normalizeUserRole(user.role) === "FACULTY" ? "info" : "default"} className="text-[10px] px-1.5 py-0">
                  {normalizeUserRole(user.role) === "FACULTY" ? "Faculty" : normalizeUserRole(user.role)}
                </StatusBadge>
              </div>
            </div>
          </div>
        )}
        <Button variant="ghost" size={collapsed ? "icon" : "sm"} className="w-full justify-start gap-2 text-muted-foreground" onClick={logout}>
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
