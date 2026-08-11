"use client";

import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  ClipboardList,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

import { SegmentedTabs } from "@/components/ui/segmented-tabs";
import { InventoryManager } from "@/features/inventory/components/inventory-manager";
import { RecipeManager } from "@/features/inventory/components/recipe-manager";
import { StockTakeManager } from "@/features/inventory/components/stock-take-manager";
import { InventoryReport } from "@/features/inventory/components/inventory-report";
import { PurchaseOrderManager } from "@/features/purchasing/components/purchase-order-manager";
import { SupplierManager } from "@/features/purchasing/components/supplier-manager";

const TABS = [
  { key: "stock", label: "Stock", icon: Boxes },
  { key: "recipes", label: "Recipes", icon: UtensilsCrossed },
  { key: "purchases", label: "Purchases", icon: ClipboardList },
  { key: "suppliers", label: "Suppliers", icon: Truck },
  { key: "counts", label: "Counts", icon: ClipboardCheck },
  { key: "reports", label: "Reports", icon: BarChart3 },
];

/** Inventory home — Stock levels and Recipe/tracking config under one header. */
export function InventoryWorkspace() {
  const [tab, setTab] = useState("stock");

  return (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Boxes className="size-5 text-brand" />
        <h1 className="font-display text-xl font-semibold tracking-tight text-ink">Inventory</h1>
      </div>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Track stock per branch and wire menu items to what they consume.
      </p>

      <div className="mt-4 max-w-xl">
        <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <div className="mt-4">
        {tab === "stock" && <InventoryManager />}
        {tab === "recipes" && <RecipeManager />}
        {tab === "purchases" && <PurchaseOrderManager />}
        {tab === "suppliers" && <SupplierManager />}
        {tab === "counts" && <StockTakeManager />}
        {tab === "reports" && <InventoryReport />}
      </div>
    </div>
  );
}
