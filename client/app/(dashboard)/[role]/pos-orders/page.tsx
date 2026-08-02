import { OrderListView } from "@/features/order/components/order-list-view";

export default function PosOrdersPage() {
  return (
    <OrderListView
      orderType="pos"
      title="POS Orders"
      subtitle="orders placed at the point of sale."
    />
  );
}
