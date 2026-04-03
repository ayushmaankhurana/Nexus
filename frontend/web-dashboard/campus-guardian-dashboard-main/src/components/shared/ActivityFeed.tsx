import { cn } from "@/lib/utils";
import { StatusBadge, getStatusVariant } from "./StatusBadge";
import { Shield, LogIn, LogOut, AlertTriangle, DoorOpen, Clock, Settings, type LucideIcon } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  action: string;
  description: string;
  userName?: string;
  timestamp: string;
}

const typeIcons: Record<string, LucideIcon> = {
  auth: LogIn,
  access: DoorOpen,
  attendance: Clock,
  incident: AlertTriangle,
  alert: AlertTriangle,
  system: Settings,
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <div className={cn("space-y-0", className)}>
      {items.map((item, i) => {
        const Icon = typeIcons[item.type] || Shield;
        return (
          <div key={item.id} className={cn("flex gap-3 py-3 animate-fade-in", i < items.length - 1 && "border-b")}>
            <div className="flex-shrink-0 mt-0.5">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug">{item.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{timeAgo(item.timestamp)}</span>
                <StatusBadge variant={getStatusVariant(item.type)} className="text-[10px] px-1.5 py-0">
                  {item.type}
                </StatusBadge>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
