import { create } from "zustand";

/**
 * Transient toggle for the branch/location picker dialog. Lets any storefront
 * component (the header strip, closed-branch notices, reservation panes) open the
 * single globally-mounted LocationPermissionDialog. Not persisted.
 */
export const useBranchPicker = create<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
