import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, description, actions, children, className, contentClassName, noPadding }: SectionCardProps) {
  return (
    <Card className={cn("animate-fade-in", className)}>
      {(title || actions) && (
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            {title && <CardTitle className="text-base font-semibold">{title}</CardTitle>}
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
          </div>
          {actions}
        </CardHeader>
      )}
      <CardContent className={cn(noPadding && "p-0", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
