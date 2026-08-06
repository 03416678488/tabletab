"use client";

import { AdminDashboard } from "@/features/admin/components/admin-dashboard";
import { ChefDashboard } from "@/features/dashboard/components/chef-dashboard";
import { WaiterDashboard } from "@/features/dashboard/components/waiter-dashboard";
import { DeliveryDashboard } from "@/features/delivery/components/delivery-dashboard";
import { useSession } from "@/hooks/use-session";

/** The dashboard landing, tailored to the signed-in staff role. */
export function RoleDashboard() {
  const role = useSession((s) => s.user?.role);

  switch (role) {
    case "chef":
      return <ChefDashboard />;
    case "waiter":
      return <WaiterDashboard />;
    case "delivery":
      return <DeliveryDashboard />;
    default:
      // admin / manager (and any unmapped role) get the full business dashboard.
      return <AdminDashboard />;
  }
}
