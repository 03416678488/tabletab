export type ShiftStatus = "open" | "closed";

export interface Shift {
  id: string;
  userId: string;
  branchId: string | null;
  status: ShiftStatus;
  note: string | null;
  clockInAt: string;
  clockOutAt: string | null;
}
