import { OrderListView } from "@/features/order/components/order-list-view";
import { RequireBranch } from "@/features/branch/components/require-branch";

export default function PosOrdersPage() {
  return (
    <RequireBranch feature="POS orders">
      <OrderListView
        orderType="pos"
        title="POS Orders"
        subtitle="orders placed at the point of sale."
      />
    </RequireBranch>
  );
}
