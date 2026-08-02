import { httpClient } from "@/lib/httpClient";
import type {
  CurrentRegister,
  RegisterSession,
} from "@/features/register/types/register.types";

export const registerService = {
  current() {
    return httpClient
      .get<CurrentRegister>("/register/current", { auth: true })
      .then((r) => r.data);
  },

  sessions() {
    return httpClient
      .get<RegisterSession[]>("/register/sessions", { auth: true })
      .then((r) => r.data);
  },

  open(body: { openingBalance: number; note?: string }) {
    return httpClient
      .post<RegisterSession>("/register/open", body, { auth: true })
      .then((r) => r.data);
  },

  close(body: { countedBalance: number; note?: string }) {
    return httpClient
      .post<{ session: RegisterSession }>("/register/close", body, { auth: true })
      .then((r) => r.data);
  },

  cash(body: { type: "cash_in" | "cash_out"; amount: number; note?: string }) {
    return httpClient
      .post("/register/cash", body, { auth: true })
      .then((r) => r.data);
  },
};
