export type StockUnit = "kg" | "g" | "l" | "ml" | "pcs";

export type ItemTrackingType = "none" | "recipe" | "unit";

export type StockMovementType =
  "purchase" | "sale" | "waste" | "adjustment" | "restock" | "transfer_in" | "transfer_out";

export type StockMovementDirection = "in" | "out";

export interface StockItem {
  id: string;
  name: string;
  unit: StockUnit;
  costPerUnit: number;
  reorderLevel: number;
  isActive: boolean;
  /** On-hand at the branch a list was scoped to (present when `branchId` sent). */
  quantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  branchId: string;
  type: StockMovementType;
  direction: StockMovementDirection;
  quantity: number;
  orderId: string | null;
  note: string | null;
  createdBy: string | null;
  createdAt: string;
}

export interface RecipeLine {
  id: string;
  menuItemId: string;
  stockItemId: string;
  quantity: number;
  stockItem?: StockItem;
}

export interface ItemRecipe {
  menuItemId: string;
  trackingType: ItemTrackingType;
  stockItemId: string | null;
  lines: RecipeLine[];
}

export interface CreateStockItemInput {
  name: string;
  unit?: StockUnit;
  costPerUnit?: number;
  reorderLevel?: number;
  isActive?: boolean;
}

export type UpdateStockItemInput = Partial<CreateStockItemInput>;

export interface AdjustStockInput {
  stockItemId: string;
  branchId: string;
  type: StockMovementType;
  /** Signed change to on-hand quantity (positive adds, negative removes). */
  delta: number;
  note?: string;
}

export interface SetRecipeInput {
  trackingType: ItemTrackingType;
  stockItemId?: string;
  lines?: { stockItemId: string; quantity: number }[];
}

export type StockTakeStatus = "draft" | "completed" | "cancelled";

export interface StockTakeLine {
  id: string;
  stockTakeId: string;
  stockItemId: string;
  systemQty: number;
  countedQty: number;
  stockItem?: { id: string; name: string; unit: string };
}

export interface StockTake {
  id: string;
  reference: string;
  branchId: string;
  status: StockTakeStatus;
  notes: string | null;
  completedAt: string | null;
  createdBy: string | null;
  lines?: StockTakeLine[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateStockTakeInput {
  branchId: string;
  notes?: string;
  stockItemIds?: string[];
}

export interface UpdateStockTakeInput {
  notes?: string;
  lines?: { stockItemId: string; countedQty: number }[];
}

export interface InventoryReport {
  stockValue: number;
  itemCount: number;
  lowStockCount: number;
  period: {
    from: string | null;
    to: string | null;
    consumptionValue: number;
    consumptionQty: number;
    wastageValue: number;
    wastageQty: number;
    purchaseValue: number;
  };
  topConsumed: {
    stockItemId: string;
    name: string;
    unit: string;
    qty: number;
    value: number;
  }[];
}

export interface ListStockTakesParams {
  page?: number;
  perPage?: number;
  branchId?: string;
  status?: StockTakeStatus;
}

export interface ListStockItemsParams {
  page?: number;
  perPage?: number;
  search?: string;
  isActive?: string;
  branchId?: string;
  lowStock?: string;
}

export interface Paginated<T> {
  items: T[];
  meta: {
    itemsPerPage: number;
    totalItems: number;
    currentPage: number;
    totalPages: number;
  };
}
