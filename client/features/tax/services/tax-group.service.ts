import { httpClient } from "@/lib/httpClient";
import type { Tax } from "@/features/tax/services/tax.service";

export interface TaxGroup {
  id: number;
  name: string;
  code: string | null;
  isActive: boolean;
  branchId?: string | null;
  taxes: Tax[];
}

export interface TaxGroupInput {
  name: string;
  code?: string;
  taxIds: number[];
  isActive?: boolean;
  branchId?: string;
}

/** Combined rate of a group = sum of its member tax rates. */
export function groupRate(g: TaxGroup): number {
  return Math.round(g.taxes.reduce((s, t) => s + t.rate, 0) * 100) / 100;
}

export const taxGroupService = {
  list(branchId?: string) {
    return httpClient
      .get<TaxGroup[]>("/tax-groups", { params: branchId ? { branchId } : undefined })
      .then((r) => r.data);
  },
  create(body: TaxGroupInput) {
    return httpClient.post<TaxGroup>("/tax-groups", body, { auth: true }).then((r) => r.data);
  },
  update(id: number, body: Partial<TaxGroupInput>) {
    return httpClient.put<TaxGroup>(`/tax-groups/${id}`, body, { auth: true }).then((r) => r.data);
  },
  remove(id: number) {
    return httpClient
      .delete<{ message: string }>(`/tax-groups/${id}`, { auth: true })
      .then((r) => r.data);
  },
};
