import { httpClient } from "@/lib/httpClient";
import type {
  CurrentRegister,
  RegisterOverview,
  RegisterSession,
} from "@/features/register/types/register.types";

export const registerService = {
  current(branchId?: string) {
    return httpClient
      .get<CurrentRegister>("/register/current", { auth: true, params: { branchId } })
      .then((r) => r.data);
  },

  sessions(branchId?: string) {
    return httpClient
      .get<RegisterSession[]>("/register/sessions", { auth: true, params: { branchId } })
      .then((r) => r.data);
  },

  /** Cross-branch drawer snapshot for the "All branches" view. */
  overview() {
    return httpClient
      .get<RegisterOverview>("/register/overview", { auth: true })
      .then((r) => r.data);
  },

  open(body: { openingBalance: number; branchId?: string; note?: string }) {
    return httpClient
      .post<RegisterSession>("/register/open", body, { auth: true })
      .then((r) => r.data);
  },

  close(body: { countedBalance: number; branchId?: string; note?: string }) {
    return httpClient
      .post<{ session: RegisterSession }>("/register/close", body, { auth: true })
      .then((r) => r.data);
  },

  cash(body: { type: "cash_in" | "cash_out"; amount: number; branchId?: string; note?: string }) {
    return httpClient.post("/register/cash", body, { auth: true }).then((r) => r.data);
  },
};
