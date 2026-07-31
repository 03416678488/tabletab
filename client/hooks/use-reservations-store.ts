import { create } from "zustand";
import { persist } from "zustand/middleware";
import { seedReservationTasks, seedReservations } from "@/lib/mock/reservations";
import type { Reservation, ReservationTask } from "@/lib/types";

interface ReservationsStore {
  reservations: Reservation[];
  tasks: ReservationTask[];
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setReservations: (list: Reservation[]) => void;
  setTasks: (list: ReservationTask[]) => void;
  upsertReservation: (r: Reservation) => void;
  upsertTask: (t: ReservationTask) => void;
}

export const useReservationsStore = create<ReservationsStore>()(
  persist(
    (set, get) => ({
      reservations: seedReservations,
      tasks: seedReservationTasks,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),

      setReservations: (list) => set({ reservations: list }),
      setTasks: (list) => set({ tasks: list }),

      upsertReservation: (r) => {
        const existing = get().reservations.findIndex((x) => x.id === r.id);
        if (existing < 0) {
          set({ reservations: [r, ...get().reservations] });
        } else {
          const next = [...get().reservations];
          next[existing] = r;
          set({ reservations: next });
        }
      },

      upsertTask: (t) => {
        const existing = get().tasks.findIndex((x) => x.id === t.id);
        if (existing < 0) {
          set({ tasks: [t, ...get().tasks] });
        } else {
          const next = [...get().tasks];
          next[existing] = t;
          set({ tasks: next });
        }
      },
    }),
    {
      name: "tabletap-reservations",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

export function getReservationsSnapshot() {
  return useReservationsStore.getState();
}
