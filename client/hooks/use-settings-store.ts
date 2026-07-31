import { create } from "zustand";
import { persist } from "zustand/middleware";
import { branches as initialBranches, TENANT } from "@/lib/mock";
import { getBranchOnlineConfig } from "@/lib/mock/branch-online";
import {
  generateTablesForFloor,
  generateTablesFromFloorPlans,
} from "@/lib/table-utils";
import { DEFAULT_BRANDING, resolveBranding } from "@/lib/theme";
import type {
  Branch,
  BranchReservationSettings,
  FloorPlanInput,
  Table,
  TenantBranding,
  TenantSettings,
} from "@/lib/types";

export interface BranchInput {
  name: string;
  address: string;
  city: string;
  phone: string;
  imageUrl: string;
  isOpen: boolean;
  openingHours: string;
  deliveryZone: string;
  deliveryFee: number;
  minOrder: number;
  onlineOrderingEnabled: boolean;
  floorPlans?: FloorPlanInput[];
}

interface SettingsStore {
  tenant: TenantSettings;
  branches: Branch[];
  reservationSettings: Record<string, BranchReservationSettings>;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  updateTenant: (patch: Partial<TenantSettings>) => void;
  updateBranding: (patch: Partial<TenantBranding>) => void;
  setBranding: (branding: TenantBranding) => void;
  getReservationSettings: (branchId: string) => BranchReservationSettings;
  updateReservationSettings: (
    branchId: string,
    patch: Partial<Omit<BranchReservationSettings, "branchId">>,
  ) => void;
  addBranch: (input: BranchInput) => Branch;
  updateBranch: (id: string, input: BranchInput) => void;
  deleteBranch: (id: string) => void;
  addTable: (branchId: string, floor: string, seats?: number) => Table | null;
  removeTable: (branchId: string, tableId: string) => void;
  getBranch: (id: string) => Branch | undefined;
}

function enrichBranch(b: Branch): Branch {
  const online = getBranchOnlineConfig(b.id);
  return {
    ...b,
    openingHours: b.openingHours ?? "Mon–Sun 11:00 – 22:00",
    deliveryZone: b.deliveryZone ?? "5 km radius",
    deliveryFee: b.deliveryFee ?? online.deliveryFee,
    minOrder: b.minOrder ?? 15,
    onlineOrderingEnabled: b.onlineOrderingEnabled ?? online.deliveryAvailable,
    floors: b.floors ?? [...new Set(b.tables.map((t) => t.floor).filter(Boolean))] as string[],
  };
}

const seedBranches = initialBranches.map(enrichBranch);

const defaultTenant: TenantSettings = {
  id: TENANT.id,
  name: TENANT.name,
  tagline: TENANT.tagline,
  branding: { ...DEFAULT_BRANDING },
  menuDisplayMode: "simple",
  slaWindowMins: 5,
  currency: "USD",
  taxRate: 8,
  serviceChargePct: 0,
  languages: ["en"],
};

function newBranchId() {
  return `br-${Date.now().toString(36)}`;
}

export function defaultReservationSettings(branchId: string): BranchReservationSettings {
  return {
    branchId,
    enabled: true,
    turnTimeMins: 90,
    reminderLeadMins: 30,
    noShowGraceMins: 15,
    bookingWindowDays: 14,
    cutoffMins: 60,
  };
}

function seedReservationSettings(branches: Branch[]): Record<string, BranchReservationSettings> {
  return Object.fromEntries(
    branches.map((b) => [b.id, defaultReservationSettings(b.id)]),
  );
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      tenant: defaultTenant,
      branches: seedBranches,
      reservationSettings: seedReservationSettings(seedBranches),
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      updateTenant: (patch) => {
        set({ tenant: { ...get().tenant, ...patch } });
      },

      updateBranding: (patch) => {
        const tenant = get().tenant;
        set({
          tenant: {
            ...tenant,
            branding: resolveBranding({ ...tenant.branding, ...patch }),
          },
        });
      },

      setBranding: (branding) => {
        set({
          tenant: {
            ...get().tenant,
            branding: resolveBranding(branding),
          },
        });
      },

      getReservationSettings: (branchId) => {
        return get().reservationSettings[branchId] ?? defaultReservationSettings(branchId);
      },

      updateReservationSettings: (branchId, patch) => {
        const current = get().reservationSettings[branchId] ?? defaultReservationSettings(branchId);
        set({
          reservationSettings: {
            ...get().reservationSettings,
            [branchId]: { ...current, ...patch, branchId },
          },
        });
      },

      addBranch: (input) => {
        const id = newBranchId();
        let tables: Table[] = [];
        if (input.floorPlans?.length) {
          tables = generateTablesFromFloorPlans(id, input.floorPlans);
        }
        const floors = input.floorPlans?.map((p) => p.floorName) ?? [];
        const branch: Branch = enrichBranch({
          id,
          name: input.name.trim(),
          address: input.address.trim(),
          city: input.city.trim(),
          phone: input.phone.trim(),
          imageUrl: input.imageUrl.trim() || `https://picsum.photos/seed/${id}/1200/640`,
          isOpen: input.isOpen,
          openingHours: input.openingHours.trim(),
          deliveryZone: input.deliveryZone.trim(),
          deliveryFee: input.deliveryFee,
          minOrder: input.minOrder,
          onlineOrderingEnabled: input.onlineOrderingEnabled,
          floors,
          tables,
        });
        set({ branches: [...get().branches, branch] });
        set({
          reservationSettings: {
            ...get().reservationSettings,
            [id]: defaultReservationSettings(id),
          },
        });
        return branch;
      },

      updateBranch: (id, input) => {
        const existing = get().branches.find((b) => b.id === id);
        if (!existing) return;
        let tables = [...existing.tables];
        if (input.floorPlans?.length) {
          const newTables = generateTablesFromFloorPlans(id, input.floorPlans, tables);
          tables = [...tables, ...newTables];
        }
        const floorSet = new Set([
          ...(existing.floors ?? []),
          ...tables.map((t) => t.floor).filter(Boolean) as string[],
        ]);
        const updated: Branch = enrichBranch({
          ...existing,
          name: input.name.trim(),
          address: input.address.trim(),
          city: input.city.trim(),
          phone: input.phone.trim(),
          imageUrl: input.imageUrl.trim() || existing.imageUrl,
          isOpen: input.isOpen,
          openingHours: input.openingHours.trim(),
          deliveryZone: input.deliveryZone.trim(),
          deliveryFee: input.deliveryFee,
          minOrder: input.minOrder,
          onlineOrderingEnabled: input.onlineOrderingEnabled,
          floors: [...floorSet],
          tables,
        });
        set({
          branches: get().branches.map((b) => (b.id === id ? updated : b)),
        });
      },

      deleteBranch: (id) => {
        set({ branches: get().branches.filter((b) => b.id !== id) });
      },

      addTable: (branchId, floor, seats) => {
        const branch = get().branches.find((b) => b.id === branchId);
        if (!branch) return null;
        const [table] = generateTablesForFloor(
          branchId,
          floor,
          1,
          seats,
          branch.tables.map((t) => t.label),
        );
        const floors = [...new Set([...(branch.floors ?? []), floor])];
        set({
          branches: get().branches.map((b) =>
            b.id === branchId
              ? { ...b, floors, tables: [...b.tables, table] }
              : b,
          ),
        });
        return table;
      },

      removeTable: (branchId, tableId) => {
        set({
          branches: get().branches.map((b) =>
            b.id === branchId
              ? { ...b, tables: b.tables.filter((t) => t.id !== tableId) }
              : b,
          ),
        });
      },

      getBranch: (id) => get().branches.find((b) => b.id === id),
    }),
    {
      name: "tabletap-settings-admin",
      onRehydrateStorage: () => (state) => {
        if (state?.tenant) {
          state.tenant.branding = resolveBranding(state.tenant.branding);
          if (!state.tenant.menuDisplayMode) {
            state.tenant.menuDisplayMode = "simple";
          }
        }
        if (state && Object.keys(state.reservationSettings ?? {}).length === 0) {
          state.reservationSettings = seedReservationSettings(state.branches);
        }
        state?.setHydrated(true);
      },
    },
  ),
);

export function getSettingsSnapshot() {
  return useSettingsStore.getState();
}
