"use client";

import { useState } from "react";
import { ImageIcon, ImagePlus, Star, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ImageGalleryDialog } from "@/features/media/components/image-gallery-dialog";

interface ImagesFieldProps {
  value: string[];
  onChange: (urls: string[]) => void;
}

/** Multi-image field: thumbnail grid (remove on hover) + gallery multi-select. */
export function ImagesField({ value, onChange }: ImagesFieldProps) {
  const [open, setOpen] = useState(false);

  const removeAt = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Images</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ImagePlus className="size-4" /> Add images
        </Button>
      </div>

      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ImageIcon className="size-6" />
          <span className="text-sm">Add images</span>
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {value.map((url, i) => (
            <div
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-secondary"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" />

              {i === 0 && (
                <span
                  title="Primary image"
                  className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-brand/90 px-2 py-0.5 text-[10px] font-medium text-white"
                >
                  <Star className="size-3" /> Primary
                </span>
              )}

              <button
                type="button"
                aria-label="Remove image"
                onClick={() => removeAt(url)}
                className={cn(
                  "absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-white/90 text-destructive shadow-sm transition-opacity hover:bg-white",
                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                )}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <ImageGalleryDialog
        open={open}
        onOpenChange={setOpen}
        multiple
        selectedUrls={value}
        onSelect={(files) => onChange(files.map((f) => f.url))}
      />
    </div>
  );
}
