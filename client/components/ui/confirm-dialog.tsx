"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" (default) shows a destructive red action; "default" is neutral. */
  tone?: "danger" | "default";
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn>(async () => false);

/**
 * App-wide confirmation dialog. Wrap the tree once with <ConfirmProvider>, then
 * anywhere:  `const confirm = useConfirm();  if (await confirm({...})) { … }`
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const [open, setOpen] = useState(false);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = useCallback((value: boolean) => {
    setOpen(false);
    resolverRef.current?.(value);
    resolverRef.current = null;
  }, []);

  const tone = opts?.tone ?? "danger";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(next) => !next && settle(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-start gap-3 text-left">
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  tone === "danger" ? "bg-rose-50 text-rose-600" : "bg-brand-tint text-brand",
                )}
              >
                <AlertTriangle className="size-5" />
              </span>
              <div className="min-w-0">
                <DialogTitle>{opts?.title}</DialogTitle>
                {opts?.description && (
                  <DialogDescription className="mt-1">{opts.description}</DialogDescription>
                )}
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => settle(false)}>
              {opts?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              variant={tone === "danger" ? "destructive" : "default"}
              size="sm"
              onClick={() => settle(true)}
            >
              {opts?.confirmLabel ?? "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext);
}
