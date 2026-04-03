import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        destructive: "bg-destructive/10 text-destructive",
        info: "bg-info/10 text-info",
        outline: "border border-border text-muted-foreground",
        active: "bg-success/10 text-success",
        inactive: "bg-muted text-muted-foreground",
        suspended: "bg-destructive/10 text-destructive",
        pending: "bg-warning/10 text-warning",
        allowed: "bg-success/10 text-success",
        denied: "bg-destructive/10 text-destructive",
        expired: "bg-muted text-muted-foreground",
        present: "bg-success/10 text-success",
        absent: "bg-destructive/10 text-destructive",
        late: "bg-warning/10 text-warning",
        excused: "bg-info/10 text-info",
        open: "bg-warning/10 text-warning",
        investigating: "bg-info/10 text-info",
        resolved: "bg-success/10 text-success",
        closed: "bg-muted text-muted-foreground",
        low: "bg-muted text-muted-foreground",
        medium: "bg-warning/10 text-warning",
        high: "bg-destructive/10 text-destructive",
        critical: "bg-destructive/15 text-destructive font-semibold",
        unread: "bg-primary/10 text-primary",
        read: "bg-muted text-muted-foreground",
        dismissed: "bg-muted text-muted-foreground",
        notice: "bg-info/10 text-info",
        in_progress: "bg-info/10 text-info",
        approved: "bg-success/10 text-success",
        missing: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return <span className={cn(statusBadgeVariants({ variant }), className)}>{children}</span>;
}

export function getStatusVariant(status: string): StatusBadgeProps["variant"] {
  return (status?.toLowerCase().replace(/\s+/g, "_") as StatusBadgeProps["variant"]) || "default";
}
