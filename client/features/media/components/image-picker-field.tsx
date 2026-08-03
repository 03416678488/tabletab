"use client";

import { useState } from "react";
import { ImageIcon, ImagePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageGalleryDialog } from "@/features/media/components/image-gallery-dialog";

interface ImagePickerFieldProps {
  value: string;
  onChange: (url: string) => void;
}

/** Image field: preview + "Choose image" (opens the gallery) + Remove. */
export function ImagePickerField({ value, onChange }: ImagePickerFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-secondary">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-5 text-muted-foreground" />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          <ImagePlus className="size-4" /> Choose image
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            Remove
          </Button>
        )}
      </div>

      <ImageGalleryDialog
        open={open}
        onOpenChange={setOpen}
        selectedUrls={value ? [value] : []}
        onSelect={(files) => files[0] && onChange(files[0].url)}
      />
    </div>
  );
}
