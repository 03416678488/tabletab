import { httpClient } from "@/lib/httpClient";
import type { Branch } from "@/lib/types";
import type { Branch as ApiBranch } from "@/features/branch/types/branch.types";

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
  }));
}
