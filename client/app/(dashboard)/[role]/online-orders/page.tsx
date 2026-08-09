import { OrderListView } from "@/features/order/components/order-list-view";
import { RequireBranch } from "@/features/branch/components/require-branch";

export default function OnlineOrdersPage() {
  return (
    <RequireBranch feature="Online orders">
      <OrderListView
        orderType="online"
        title="Online Orders"
        subtitle="delivery & pickup orders from the storefront."
      />
    </RequireBranch>
  );
}
