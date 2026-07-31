import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  href?: string;
  className?: string;
  /** Render on a dark surface (e.g. kitchen display). */
  dark?: boolean;
  showWordmark?: boolean;
}

export function Logo({ href = "/", className, dark = false, showWordmark = true }: LogoProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-white shadow-sm">
        <UtensilsCrossed className="size-5" aria-hidden />
      </span>
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              "font-display text-[17px] font-bold tracking-tight",
              dark ? "text-white" : "text-ink",
            )}
          >
            TableTap
          </span>
          <span className={cn("text-[11px]", dark ? "text-slate-400" : "text-muted-foreground")}>
            by Olive &amp; Ash
          </span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {content}
      </Link>
    );
  }
  return content;
}
