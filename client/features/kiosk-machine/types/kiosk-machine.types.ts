export interface KioskMachine {
  id: number;
  machineId: string;
  userName: string | null;
  username: string;
  isActive: boolean;
  branchId: string | null;
  branch?: { id: string; name: string } | null;
}

export interface KioskMachineInput {
  machineId: string;
  username: string;
  userName?: string;
  branchId?: string;
  isActive?: boolean;
}
