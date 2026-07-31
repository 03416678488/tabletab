import type { FloorPlanInput, Table } from "@/lib/types";

/** First letter of the floor name for table labels (Ground → G, First → F). */
export function floorTablePrefix(floorName: string): string {
  const word = floorName.trim().split(/\s+/)[0] ?? "T";
  return word.charAt(0).toUpperCase();
}

export function newQrToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `qr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  }
  return `qr_${Math.random().toString(36).slice(2, 18)}`;
}

export function newTableId(branchId: string): string {
  return `${branchId}-t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Generate tables for a floor with labels like G1, G2 … avoiding existing labels. */
export function generateTablesForFloor(
  branchId: string,
  floorName: string,
  count: number,
  seatsPerTable?: number,
  existingLabels: string[] = [],
): Table[] {
  const prefix = floorTablePrefix(floorName);
  const used = new Set(existingLabels.map((l) => l.toUpperCase()));
  const tables: Table[] = [];
  let n = 1;
  while (tables.length < count) {
    const label = `${prefix}${n}`;
    n += 1;
    if (used.has(label.toUpperCase())) continue;
    used.add(label.toUpperCase());
    tables.push({
      id: newTableId(branchId),
      branchId,
      label,
      floor: floorName,
      seats: seatsPerTable,
      qrToken: newQrToken(),
      status: "available",
    });
  }
  return tables;
}

export function generateTablesFromFloorPlans(
  branchId: string,
  plans: FloorPlanInput[],
  existingTables: Table[] = [],
): Table[] {
  const labels = existingTables.map((t) => t.label);
  const generated: Table[] = [];
  for (const plan of plans) {
    if (plan.tableCount <= 0) continue;
    const batch = generateTablesForFloor(
      branchId,
      plan.floorName,
      plan.tableCount,
      plan.seatsPerTable,
      [...labels, ...generated.map((t) => t.label)],
    );
    generated.push(...batch);
  }
  return generated;
}

export function groupTablesByFloor(tables: Table[]): Record<string, Table[]> {
  const groups: Record<string, Table[]> = {};
  for (const t of tables) {
    const floor = t.floor ?? "Main";
    if (!groups[floor]) groups[floor] = [];
    groups[floor].push(t);
  }
  for (const floor of Object.keys(groups)) {
    groups[floor].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
  }
  return groups;
}
