import * as React from "react";
import { cn } from "@/lib/utils";

/** `required` appends a red asterisk to flag a mandatory field. */
function Label({
  className,
  required,
  children,
  ...props
}: React.ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label
      className={cn(
        "text-sm font-medium leading-none text-ink peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-destructive"> *</span>}
    </label>
  );
}

export { Label };
