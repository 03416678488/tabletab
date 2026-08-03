import { httpClient } from "@/lib/httpClient";

export interface Plan {
  id: string;
  label: string;
  priceCents: number;
  limits: { branches: number | null; staff: number | null; ordersPerMonth: number | null };
  features: string[];
}

export const planService = {
  list: () => httpClient.get<Plan[]>(`/plans`, { auth: true }).then((r) => r.data),
};
