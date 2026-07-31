import type {
  BuffetAddOn,
  BuffetAddOnSelection,
  BuffetDay,
  BuffetPackage,
  BuffetSelection,
  BuffetTier,
  BuffetTierSelection,
  Order,
} from "@/lib/types";

const DAY_MAP: BuffetDay[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

function dayOfWeek(date: Date): BuffetDay {
  return DAY_MAP[date.getDay()];
}

function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

/** Check if a buffet package is available at a given moment or reservation slot. */
export function isBuffetAvailable(
  pkg: BuffetPackage,
  at: Date = new Date(),
): boolean {
  if (!pkg.isActive) return false;
  const day = dayOfWeek(at);
  if (!pkg.availability.days.includes(day)) return false;
  const mins = at.getHours() * 60 + at.getMinutes();
  const start = parseHm(pkg.availability.startTime);
  const end = parseHm(pkg.availability.endTime);
  return mins >= start && mins < end;
}

/** Availability for a reservation date + time slot. */
export function isBuffetAvailableForSlot(
  pkg: BuffetPackage,
  date: string,
  time: string,
): boolean {
  const at = new Date(`${date}T${time}:00`);
  return isBuffetAvailable(pkg, at);
}

export function buffetAppliesToBranch(pkg: BuffetPackage, branchId: string): boolean {
  return !pkg.branchId || pkg.branchId === branchId;
}

export function listBuffetPackagesForBranch(
  packages: BuffetPackage[],
  branchId: string,
  at?: Date,
): BuffetPackage[] {
  return packages.filter(
    (p) =>
      buffetAppliesToBranch(p, branchId) &&
      p.isActive &&
      (at ? isBuffetAvailable(p, at) : true),
  );
}

export function defaultTierCounts(
  pkg: BuffetPackage,
  partySize: number,
): Record<string, number> {
  const counts: Record<string, number> = {};
  if (pkg.tiers?.length) {
    const adult = pkg.tiers.find((t) => /adult/i.test(t.label)) ?? pkg.tiers[0];
    counts[adult.id] = partySize;
    for (const t of pkg.tiers) {
      if (t.id !== adult.id) counts[t.id] = 0;
    }
  } else {
    counts.__flat = partySize;
  }
  return counts;
}

export function buildBuffetSelection(
  pkg: BuffetPackage,
  tierCounts: Record<string, number>,
  addOnCounts: Record<string, number> = {},
): BuffetSelection {
  const tiers: BuffetTierSelection[] = [];
  let totalCovers = 0;

  if (pkg.tiers?.length) {
    for (const tier of pkg.tiers) {
      const count = tierCounts[tier.id] ?? 0;
      if (count > 0) {
        tiers.push({
          tierId: tier.id,
          label: tier.label,
          count,
          unitPrice: tier.price,
        });
        totalCovers += count;
      }
    }
  } else {
    const count = tierCounts.__flat ?? 0;
    if (count > 0 && pkg.pricePerPerson != null) {
      tiers.push({
        tierId: "__flat",
        label: "Per person",
        count,
        unitPrice: pkg.pricePerPerson,
      });
      totalCovers = count;
    }
  }

  const addOns: BuffetAddOnSelection[] = [];
  for (const addOn of pkg.addOns ?? []) {
    const qty = addOnCounts[addOn.id] ?? 0;
    if (qty > 0) {
      addOns.push({
        addOnId: addOn.id,
        name: addOn.name,
        quantity: qty,
        unitPrice: addOn.price,
      });
    }
  }

  const tierTotal = tiers.reduce((s, t) => s + t.count * t.unitPrice, 0);
  const addOnTotal = addOns.reduce((s, a) => s + a.quantity * a.unitPrice, 0);

  return {
    packageId: pkg.id,
    packageName: pkg.name,
    tiers,
    addOns,
    totalCovers,
    subtotal: tierTotal + addOnTotal,
  };
}

export function buffetSelectionCoversValid(
  pkg: BuffetPackage,
  selection: BuffetSelection,
): boolean {
  if (selection.totalCovers <= 0) return false;
  if (pkg.minGuests != null && selection.totalCovers < pkg.minGuests) return false;
  if (pkg.maxGuests != null && selection.totalCovers > pkg.maxGuests) return false;
  return true;
}

export function orderItemsSubtotal(items: Order["items"]): number {
  return items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}

export function orderBuffetSubtotal(order: Pick<Order, "buffet">): number {
  return order.buffet?.subtotal ?? 0;
}

export function orderFullSubtotal(order: Pick<Order, "items" | "buffet">): number {
  return orderItemsSubtotal(order.items) + orderBuffetSubtotal(order);
}

export function formatBuffetSummary(buffet: BuffetSelection): string {
  const tierPart = buffet.tiers.map((t) => `${t.count}× ${t.label}`).join(", ");
  const addOnPart =
    buffet.addOns.length > 0
      ? ` + ${buffet.addOns.map((a) => `${a.quantity}× ${a.name}`).join(", ")}`
      : "";
  return `${buffet.packageName}: ${tierPart}${addOnPart}`;
}

export function buffetPackageUsesTiers(pkg: BuffetPackage): pkg is BuffetPackage & {
  tiers: BuffetTier[];
} {
  return !!pkg.tiers?.length;
}

export function buffetPackageAddOns(pkg: BuffetPackage): BuffetAddOn[] {
  return pkg.addOns ?? [];
}
