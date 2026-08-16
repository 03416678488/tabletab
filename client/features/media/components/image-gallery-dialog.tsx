"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronRight,
  Folder,
  FolderPlus,
  Home,
  ImageIcon,
  Images,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useMedia } from "@/features/media/hooks/use-media";
import type { MediaFile, MediaFolder } from "@/features/media/types/media.types";

interface ImageGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (files: MediaFile[]) => void;
  multiple?: boolean;
  selectedUrls?: string[];
}

export function ImageGalleryDialog({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  selectedUrls = [],
}: ImageGalleryDialogProps) {
  const {
    images,
    folders,
    currentFolderId,
    loading,
    error,
    uploading,
    openFolder,
    upload,
    remove,
    createFolder,
    deleteFolder,
  } = useMedia();
  const confirm = useConfirm();

  const inputRef = useRef<HTMLInputElement>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Inline create: `undefined` = not creating; otherwise the target parent id
  // (null = a new top-level folder).
  const [creatingParentId, setCreatingParentId] = useState<string | null | undefined>(undefined);
  const [folderName, setFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);

  useEffect(() => {
    if (open) {
      openFolder(null);
      setChosen(new Set(selectedUrls));
      setCreatingParentId(undefined);
      setFolderName("");
      setExpanded(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const childrenOf = useMemo(() => {
    const map = new Map<string | null, MediaFolder[]>();
    for (const f of folders) {
      const key = f.parentId ?? null;
      (map.get(key) ?? map.set(key, []).get(key)!).push(f);
    }
    return map;
  }, [folders]);

  const pathFolders = useMemo(() => {
    const byId = new Map(folders.map((f) => [f.id, f]));
    const chain: MediaFolder[] = [];
    let cur = currentFolderId ? byId.get(currentFolderId) : undefined;
    while (cur) {
      chain.unshift(cur);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return chain;
  }, [folders, currentFolderId]);

  useEffect(() => {
    if (pathFolders.length) {
      setExpanded((prev) => new Set([...prev, ...pathFolders.map((f) => f.id)]));
    }
  }, [pathFolders]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const uploaded = await upload(file);
      if (multiple) setChosen((prev) => new Set(prev).add(uploaded.url));
      else {
        onSelect([uploaded]);
        onOpenChange(false);
      }
    } catch {}
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

  const onDeleteImage = async (e: React.MouseEvent, file: MediaFile) => {
    e.stopPropagation();
    const ok = await confirm({
      title: "Delete image?",
      description: `“${file.originalFileName}” will be permanently removed.`,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    setDeletingId(file.id);
    try {
      await remove(file.id);
      setChosen((prev) => {
        const next = new Set(prev);
        next.delete(file.url);
        return next;
      });
    } catch {
    } finally {
      setDeletingId(null);
    }
  };

  const onDeleteFolder = async (e: React.MouseEvent, folder: MediaFolder) => {
    e.stopPropagation();
    const hasChildren = folders.some((f) => f.parentId === folder.id);
    const ok = await confirm({
      title: `Delete “${folder.name}”?`,
      description: hasChildren
        ? "This folder and all its subfolders will be deleted. Images inside move back to Uncategorised."
        : "The folder will be deleted and its images move back to Uncategorised.",
      confirmLabel: "Delete folder",
    });
    if (!ok) return;
    try {
      await deleteFolder(folder.id);
    } catch {}
  };

  const startCreate = (e: React.MouseEvent, parentId: string | null) => {
    e.stopPropagation();
    setCreatingParentId(parentId);
    setFolderName("");
    if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
  };

  const cancelCreate = () => {
    setCreatingParentId(undefined);
    setFolderName("");
  };

  const submitFolder = async () => {
    const name = folderName.trim();
    if (!name || creatingParentId === undefined) return;
    setSavingFolder(true);
    try {
      const created = await createFolder(name, creatingParentId);
      cancelCreate();
      openFolder(created.id);
    } catch {
    } finally {
      setSavingFolder(false);
    }
  };

  const toggleExpand = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const isSelected = (file: MediaFile) =>
    multiple ? chosen.has(file.url) : selectedUrls.includes(file.url);

  const newFolderInput = (depth: number) => (
    <div
      key="__new-folder"
      style={{ paddingLeft: 8 + depth * 14 }}
      className="flex items-center gap-1 py-1 pr-2"
    >
      <span className="size-4 shrink-0" />
      <Input
        autoFocus
        value={folderName}
        onChange={(e) => setFolderName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submitFolder();
          if (e.key === "Escape") cancelCreate();
        }}
        placeholder="Folder name"
        className="h-7 text-xs"
      />
      <button
        type="button"
        aria-label="Create folder"
        onClick={submitFolder}
        disabled={savingFolder || !folderName.trim()}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand text-white disabled:opacity-50"
      >
        {savingFolder ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
      </button>
      <button
        type="button"
        aria-label="Cancel"
        onClick={cancelCreate}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );

  // Recursively render folders under `parentId`, plus the inline create input
  // when a new folder is being added at this level.
  const renderTree = (parentId: string | null, depth: number): React.ReactNode[] => {
    const rows: React.ReactNode[] = (childrenOf.get(parentId) ?? []).map((f) => {
      const kids = childrenOf.get(f.id) ?? [];
      const isOpen = expanded.has(f.id);
      return (
        <div key={f.id}>
          <FolderRow
            label={f.name}
            count={f.imageCount}
            depth={depth}
            active={currentFolderId === f.id}
            hasChildren={kids.length > 0}
            expanded={isOpen}
            onToggle={() => toggleExpand(f.id)}
            onClick={() => openFolder(f.id)}
            onAddChild={(e) => startCreate(e, f.id)}
            onDelete={(e) => onDeleteFolder(e, f)}
          />
          {isOpen && renderTree(f.id, depth + 1)}
        </div>
      );
    });
    if (creatingParentId === parentId) rows.push(newFolderInput(depth));
    return rows;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          {/* pr-8 keeps the Upload button clear of the dialog's absolute close X */}
          <div className="flex items-center justify-between gap-4 pr-8">
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

        <div className="flex gap-4">
          {/* Folder tree */}
          <aside className="flex w-52 shrink-0 flex-col border-r border-border pr-3">
            <FolderRow
              label="Uncategorised"
              icon={Images}
              depth={0}
              active={currentFolderId === null}
              onClick={() => openFolder(null)}
              onAddChild={(e) => startCreate(e, null)}
            />
            <div className="mt-1 max-h-[48vh] flex-1 space-y-0.5 overflow-y-auto">
              {renderTree(null, 0)}
            </div>
          </aside>

          {/* Images */}
          <div className="min-w-0 flex-1">
            {/* Breadcrumb */}
            <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => openFolder(null)}
                className={cn(
                  "flex items-center gap-1 rounded px-1.5 py-0.5 hover:text-ink",
                  currentFolderId === null && "font-medium text-ink",
                )}
              >
                <Home className="size-3.5" /> Home
              </button>
              {pathFolders.map((f) => (
                <span key={f.id} className="flex items-center gap-1">
                  <ChevronRight className="size-3.5 opacity-60" />
                  <button
                    type="button"
                    onClick={() => openFolder(f.id)}
                    className={cn(
                      "rounded px-1.5 py-0.5 hover:text-ink",
                      currentFolderId === f.id && "font-medium text-ink",
                    )}
                  >
                    {f.name}
                  </button>
                </span>
              ))}
              {!loading && (
                <span className="ml-1 opacity-70">
                  · {images.length} image{images.length === 1 ? "" : "s"}
                </span>
              )}
            </nav>

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
                  <Button variant="outline" onClick={() => openFolder(currentFolderId)}>
                    Retry
                  </Button>
                }
              />
            ) : images.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="No images here"
                description={
                  currentFolderId
                    ? "Upload an image to add it to this folder."
                    : "Upload your first image to get started."
                }
                action={
                  <Button onClick={() => inputRef.current?.click()}>
                    <Upload className="size-4" /> Upload image
                  </Button>
                }
              />
            ) : (
              <div className="grid max-h-[55vh] grid-cols-2 gap-4 overflow-y-auto p-1 sm:grid-cols-3 md:grid-cols-4">
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
                        onClick={(e) => onDeleteImage(e, img)}
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
          </div>
        </div>

        {multiple && (
          <DialogFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={confirmMultiple}>
              Add {chosen.size > 0 ? `${chosen.size} ` : ""}image{chosen.size === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FolderRow({
  label,
  count,
  depth,
  active,
  icon: Icon = Folder,
  hasChildren = false,
  expanded = false,
  onToggle,
  onClick,
  onAddChild,
  onDelete,
}: {
  label: string;
  count?: number;
  depth: number;
  active: boolean;
  icon?: typeof Folder;
  hasChildren?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onClick: () => void;
  onAddChild?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick();
      }}
      style={{ paddingLeft: 8 + depth * 14 }}
      className={cn(
        "group flex cursor-pointer items-center gap-1.5 rounded-lg py-2 pr-2 text-sm transition-colors",
        active ? "bg-brand-tint/50 font-medium text-brand-deep" : "text-ink hover:bg-secondary",
      )}
    >
      {hasChildren ? (
        <button
          type="button"
          aria-label={expanded ? "Collapse" : "Expand"}
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          className="flex size-4 shrink-0 items-center justify-center text-muted-foreground"
        >
          <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
        </button>
      ) : (
        <span className="size-4 shrink-0" />
      )}
      <Icon className={cn("size-4 shrink-0", active ? "text-brand" : "text-muted-foreground")} />
      <span className="min-w-0 flex-1 truncate">{label}</span>

      <div className="flex shrink-0 items-center gap-1">
        {typeof count === "number" && (
          <span className="text-xs text-muted-foreground group-hover:hidden">{count}</span>
        )}
        {onAddChild && (
          <button
            type="button"
            aria-label={`New folder in ${label}`}
            title={`New folder in ${label}`}
            onClick={onAddChild}
            className="text-muted-foreground transition-colors hover:text-brand"
          >
            <FolderPlus className="size-4" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            aria-label={`Delete folder ${label}`}
            onClick={onDelete}
            className="hidden text-muted-foreground hover:text-rose-600 group-hover:block"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
