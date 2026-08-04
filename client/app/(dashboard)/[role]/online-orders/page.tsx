import { OrderListView } from "@/features/order/components/order-list-view";

export default function OnlineOrdersPage() {
  return (
    <OrderListView
      orderType="online"
      title="Online Orders"
      subtitle="delivery & pickup orders from the storefront."
    />
  );
}
