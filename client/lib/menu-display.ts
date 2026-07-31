import type { MenuDisplayMode, MenuItem } from "@/lib/types";

export function shouldShow3dModel(mode: MenuDisplayMode, item: Pick<MenuItem, "model3dUrl">): boolean {
  return mode === "3d" && Boolean(item.model3dUrl?.trim());
}
