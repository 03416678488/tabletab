import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PagePlaceholderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
}

/**
 * Consistent scaffold for pages that are wired into the nav but whose feature
 * is not built out yet.
 */
export function PagePlaceholder({
  title,
  description,
  icon: Icon,
}: PagePlaceholderProps) {
  return (
    <div className="w-full">
      <h1 className="font-display text-xl font-semibold tracking-tight text-ink">
        {title}
      </h1>
      {description && (
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      )}

      <Card className="mt-4 flex flex-col items-center justify-center gap-3 border-dashed py-20 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
          <Icon className="size-6" />
        </span>
        <div>
          <p className="text-sm font-medium text-ink">{title} is coming soon</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            This screen is scaffolded and ready to build out.
          </p>
        </div>
      </Card>
    </div>
  );
}
