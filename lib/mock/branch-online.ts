/** Per-branch online ordering capabilities (delivery / pickup). */
export interface BranchOnlineConfig {
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  deliveryFee: number;
  deliveryEtaMinutes: number;
  /** Pickup time slots shown at checkout (24h labels). */
  pickupSlots: string[];
}

export const branchOnlineConfig: Record<string, BranchOnlineConfig> = {
  "br-riverside": {
    deliveryAvailable: true,
    pickupAvailable: true,
    deliveryFee: 4.5,
    deliveryEtaMinutes: 35,
    pickupSlots: ["12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "6:00 PM", "6:30 PM", "7:00 PM"],
  },
  "br-uptown": {
    deliveryAvailable: false,
    pickupAvailable: true,
    deliveryFee: 0,
    deliveryEtaMinutes: 0,
    pickupSlots: ["11:30 AM", "12:00 PM", "12:30 PM", "5:30 PM", "6:00 PM", "6:30 PM"],
  },
};

export function getBranchOnlineConfig(branchId: string): BranchOnlineConfig {
  return (
    branchOnlineConfig[branchId] ?? {
      deliveryAvailable: false,
      pickupAvailable: true,
      deliveryFee: 0,
      deliveryEtaMinutes: 30,
      pickupSlots: ["12:00 PM", "12:30 PM", "1:00 PM"],
    }
  );
}
