import { httpClient } from "@/lib/httpClient";
import type {
  KioskMachine,
  KioskMachineInput,
} from "@/features/kiosk-machine/types/kiosk-machine.types";

export const kioskMachineService = {
  list() {
    return httpClient
      .get<KioskMachine[]>("/kiosk-machines", { auth: true })
      .then((r) => r.data);
  },
  create(body: KioskMachineInput) {
    return httpClient
      .post<KioskMachine>("/kiosk-machines", body, { auth: true })
      .then((r) => r.data);
  },
  update(id: number, body: Partial<KioskMachineInput>) {
    return httpClient
      .put<KioskMachine>(`/kiosk-machines/${id}`, body, { auth: true })
      .then((r) => r.data);
  },
  remove(id: number) {
    return httpClient
      .delete<{ message: string }>(`/kiosk-machines/${id}`, { auth: true })
      .then((r) => r.data);
  },
};
