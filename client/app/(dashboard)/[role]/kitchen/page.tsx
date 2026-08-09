"use client";

import { KitchenBoard } from "@/features/kitchen/components/kitchen-board";
import { RequireBranch } from "@/features/branch/components/require-branch";

export default function KitchenPage() {
  return (
    <RequireBranch feature="The kitchen">
      <KitchenBoard />
    </RequireBranch>
  );
}
