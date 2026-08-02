"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { ApiError } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

import { useMedia } from "@/features/media/hooks/use-media";
import type { MediaFile } from "@/features/media/types/media.types";

interface ImageGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Selected file(s). Always an array — one entry in single mode. */
  onSelect: (files: MediaFile[]) => void;
  /** Allow picking several images before confirming. */
  multiple?: boolean;
  /** Pre-selected image URLs (for highlighting / multi editing). */
  selectedUrls?: string[];
}

export function ImageGalleryDialog({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  selectedUrls = [],
}: ImageGalleryDialogProps) {
  const { images, loading, error, uploading, refetch, upload, remove } = useMedia();
  const inputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      void refetch();
      setChosen(new Set(selectedUrls));
    }
    // Re-seed only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refetch]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const uploaded = await upload(file);
      toast("Image uploaded", { tone: "success" });
      if (multiple) {
        setChosen((prev) => new Set(prev).add(uploaded.url));
      } else {
        onSelect([uploaded]);
        onOpenChange(false);
      }
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Upload failed", {
        tone: "error",
      });
    }
  };

  const onTileClick = (file: MediaFile) => {
    if (multiple) {
      setChosen((prev) => {
        const next = new Set(prev);
        if (next.has(file.url)) next.delete(file.url);
        else next.add(file.url);
        return next;
      });
    } else {
      onSelect([file]);
      onOpenChange(false);
    }
  };

  const confirmMultiple = () => {
    onSelect(images.filter((i) => chosen.has(i.url)));
    onOpenChange(false);
  };

  const onDelete = async (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation();
    if (!confirm(`Delete "${file.originalFileName}"?`)) return;
    setDeletingId(file.id);
    try {
      await remove(file.id);
      setChosen((prev) => {
        const next = new Set(prev);
        next.delete(file.url);
        return next;
      });
      toast("Image deleted", { tone: "success" });
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to delete image", {
        tone: "error",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const isSelected = (file: MediaFile) =>
    multiple ? chosen.has(file.url) : selectedUrls.includes(file.url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle>Image gallery</DialogTitle>
              <DialogDescription>
                {multiple
                  ? "Select one or more images, or upload new ones."
                  : "Pick an image or upload a new one."}
              </DialogDescription>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              Upload
            </Button>
          </div>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <EmptyState
            icon={ImageIcon}
            title="Couldn't load images"
            description={error}
            action={
              <Button variant="outline" onClick={refetch}>
                Retry
              </Button>
            }
          />
        ) : images.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No images yet"
            description="Upload your first image to get started."
            action={
              <Button onClick={() => inputRef.current?.click()}>
                <Upload className="size-4" /> Upload image
              </Button>
            }
          />
        ) : (
          <div className="grid max-h-[65vh] grid-cols-2 gap-4 overflow-y-auto p-1 sm:grid-cols-3 md:grid-cols-4">
            {images.map((img) => {
              const selected = isSelected(img);
              const isDeleting = deletingId === img.id;
              return (
                <div
                  key={img.id}
                  role="button"
                  tabIndex={0}
                  title={img.originalFileName}
                  onClick={() => onTileClick(img)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onTileClick(img);
                  }}
                  className={cn(
                    "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border bg-secondary outline-none transition-all focus-visible:ring-2 focus-visible:ring-ring",
                    selected
                      ? "border-brand ring-2 ring-brand"
                      : "border-border hover:ring-2 hover:ring-brand/40",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.originalFileName}
                    className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
                  />

                  <div
                    className={cn(
                      "pointer-events-none absolute inset-0 transition-colors",
                      selected ? "bg-black/10" : "group-hover:bg-black/10",
                    )}
                  />

                  {selected && (
                    <span className="absolute left-2 top-2 flex size-6 items-center justify-center rounded-full bg-brand text-white shadow">
                      <Check className="size-4" />
                    </span>
                  )}

                  <button
                    type="button"
                    aria-label={`Delete ${img.originalFileName}`}
                    onClick={(e) => onDelete(e, img)}
                    disabled={isDeleting}
                    className={cn(
                      "absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-white/90 text-destructive shadow-sm transition-opacity hover:bg-white",
                      "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                    )}
                  >
                    {isDeleting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {multiple && (
          <DialogFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmMultiple}>
              Add {chosen.size > 0 ? `${chosen.size} ` : ""}image
              {chosen.size === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
