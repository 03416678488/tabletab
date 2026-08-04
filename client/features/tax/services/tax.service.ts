import { httpClient } from "@/lib/httpClient";

export interface Tax {
  id: number;
  name: string;
  code: string;
  rate: number;
  isActive: boolean;
}

export interface TaxInput {
  name: string;
  code: string;
  rate: number;
  isActive?: boolean;
}

export const taxService = {
  list() {
    return httpClient.get<Tax[]>("/taxes").then((r) => r.data);
  },
  create(body: TaxInput) {
    return httpClient.post<Tax>("/taxes", body, { auth: true }).then((r) => r.data);
  },
  update(id: number, body: Partial<TaxInput>) {
    return httpClient.put<Tax>(`/taxes/${id}`, body, { auth: true }).then((r) => r.data);
  },
  remove(id: number) {
    return httpClient
      .delete<{ message: string }>(`/taxes/${id}`, { auth: true })
      .then((r) => r.data);
  },
};
