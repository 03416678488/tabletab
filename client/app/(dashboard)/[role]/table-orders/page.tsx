import { OrderListView } from "@/features/order/components/order-list-view";

export default function TableOrdersPage() {
  return (
    <OrderListView
      orderType="table"
      title="Table Orders"
      subtitle="dine-in orders by table."
    />
  );
}
