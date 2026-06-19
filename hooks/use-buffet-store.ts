import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedBuffetPackages } from "@/lib/mock/buffet";
import type { BuffetPackage } from "@/lib/types";

interface BuffetStore {
  packages: BuffetPackage[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  upsertPackage: (pkg: BuffetPackage) => void;
  removePackage: (id: string) => void;
  getPackage: (id: string) => BuffetPackage | undefined;
}

export const useBuffetStore = create<BuffetStore>()(
  persist(
    (set, get) => ({
      packages: seedBuffetPackages,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      upsertPackage: (pkg) => {
        const idx = get().packages.findIndex((p) => p.id === pkg.id);
        if (idx < 0) {
          set({ packages: [pkg, ...get().packages] });
        } else {
          const next = [...get().packages];
          next[idx] = pkg;
          set({ packages: next });
        }
      },

      removePackage: (id) => {
        set({ packages: get().packages.filter((p) => p.id !== id) });
      },

      getPackage: (id) => get().packages.find((p) => p.id === id),
    }),
    {
      name: "tabletap-buffet",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function getBuffetSnapshot() {
  return useBuffetStore.getState();
}
