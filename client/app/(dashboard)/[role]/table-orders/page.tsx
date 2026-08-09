import { OrderListView } from "@/features/order/components/order-list-view";
import { RequireBranch } from "@/features/branch/components/require-branch";

export default function TableOrdersPage() {
  return (
    <RequireBranch feature="Table orders">
      <OrderListView orderType="table" title="Table Orders" subtitle="dine-in orders by table." />
    </RequireBranch>
  );
}
