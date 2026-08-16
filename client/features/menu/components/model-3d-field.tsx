"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { Box, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isModel3dFile,
  isModel3dUrl,
  MAX_MODEL_3D_BYTES,
  MODEL_3D_ACCEPT,
  readFileAsDataUrl,
} from "@/lib/model-3d-utils";

const ModelViewer3d = dynamic(
  () => import("@/features/menu/components/model-viewer-3d").then((m) => m.ModelViewer3d),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full rounded-xl" />,
  },
);

interface Model3dFieldProps {
  value: string;
  posterUrl?: string;
  onChange: (model3dUrl: string) => void;
}

export function Model3dField({ value, posterUrl, onChange }: Model3dFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const hasModel = isModel3dUrl(value);

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!isModel3dFile(file)) {
      return;
    }
    if (file.size > MAX_MODEL_3D_BYTES) {
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
    } catch {}
  };

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-subtle/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">3D model (.glb / .gltf)</Label>
        {hasModel && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
            <X className="size-4" />
            Clear
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Optional. Upload a file or paste a URL. Shown to guests in 3D menu mode; otherwise their
        photo is used.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept={MODEL_3D_ACCEPT}
        className="sr-only"
        onChange={(e) => {
          void handleUpload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" />
          Upload model
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="item-3d-url" className="text-xs text-muted-foreground">
          Or model URL
        </Label>
        <Input
          id="item-3d-url"
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…/dish.glb"
          className="font-mono text-xs"
        />
        {value.startsWith("data:") && (
          <p className="text-xs text-muted-foreground">Uploaded file stored for this item.</p>
        )}
      </div>

      {hasModel && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="relative aspect-[4/3] w-full">
            <ModelViewer3d
              src={value}
              poster={posterUrl}
              alt="3D model preview"
              className="absolute inset-0"
            />
          </div>
          <p className="flex items-center gap-1.5 border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
            <Box className="size-3 shrink-0" />
            Preview — drag to rotate
          </p>
        </div>
      )}
    </div>
  );
}
