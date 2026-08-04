import { httpClient } from "@/lib/httpClient";
import type { BranchOnlineConfig } from "@/lib/mock/branch-online";
import type { Branch } from "@/lib/types";
import type { Branch as ApiBranch } from "@/features/branch/types/branch.types";

/** A few upcoming pickup slots (every 15 min, starting ~20 min out). */
export function generatePickupSlots(count = 5): string[] {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 20);
  const slots: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = new Date(now.getTime() + i * 15 * 60 * 1000);
    slots.push(
      t.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
    );
  }
  return slots;
}

/** Derive the storefront delivery/pickup config from a real branch. */
export function branchOnlineConfig(branch: Branch): BranchOnlineConfig {
  const online = branch.onlineOrderingEnabled !== false;
  return {
    deliveryAvailable: online && branch.deliveryEnabled !== false,
    pickupAvailable: online && branch.pickupEnabled !== false,
    deliveryFee: branch.deliveryFee ?? 0,
    deliveryEtaMinutes: branch.deliveryEtaMinutes ?? 30,
    pickupSlots: generatePickupSlots(),
  };
}

/**
 * Public list of live branches for the storefront (nearest-branch resolution).
 * Maps the admin/API branch shape to the storefront `Branch` type.
 */
export async function fetchStorefrontBranches(): Promise<Branch[]> {
  const res = await httpClient.get<{ items?: ApiBranch[] } | ApiBranch[]>("/branches", {
    params: { perPage: 100 },
  });
  const items = Array.isArray(res.data) ? res.data : (res.data.items ?? []);
  return items.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    city: b.city,
    phone: b.phone,
    imageUrl: b.imageUrl ?? "",
    isOpen: b.isOpen,
    lat: b.lat ?? undefined,
    lng: b.lng ?? undefined,
    tables: [],
    deliveryFee: b.deliveryFee ?? undefined,
    minOrder: b.minOrder ?? undefined,
    onlineOrderingEnabled: b.onlineOrderingEnabled,
    deliveryEnabled: b.deliveryEnabled,
    pickupEnabled: b.pickupEnabled,
    reservationsEnabled: b.reservationsEnabled,
    deliveryEtaMinutes: b.deliveryEtaMinutes ?? undefined,
  }));
}
