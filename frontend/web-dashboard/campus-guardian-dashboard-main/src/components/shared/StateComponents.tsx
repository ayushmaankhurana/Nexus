import { cn } from "@/lib/utils";
import { AlertCircle, FileQuestion, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 text-center", className)}>
      <div className="mb-4 text-muted-foreground">
        {icon || <FileQuestion className="h-10 w-10" />}
      </div>
      <h3 className="text-sm font-medium">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <Button variant="outline" size="sm" className="mt-4" onClick={action.onClick}>{action.label}</Button>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-10 w-10 text-destructive mb-4" />
      <h3 className="text-sm font-medium">Something went wrong</h3>
      <p className="mt-1 text-sm text-muted-foreground">{message || "An unexpected error occurred."}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>Try again</Button>}
    </div>
  );
}

export function LoadingState({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center py-12", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-lg border bg-card p-6 animate-pulse">
      <div className="h-3 w-24 bg-muted rounded mb-3" />
      <div className="h-7 w-16 bg-muted rounded mb-2" />
      <div className="h-3 w-32 bg-muted rounded" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-10 bg-muted rounded" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-muted/50 rounded" />
      ))}
    </div>
  );
}
