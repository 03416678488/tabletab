import type { BuffetPackage } from "@/lib/types";

export const seedBuffetPackages: BuffetPackage[] = [
  {
    id: "buf-sunday-roast",
    branchId: "br-riverside",
    name: "Sunday Roast Buffet",
    description:
      "Carving station, seasonal sides, and desserts. Unlimited refills during your sitting.",
    tiers: [
      { id: "tier-adult", label: "Adult", price: 32 },
      { id: "tier-child", label: "Child (under 12)", price: 16 },
      { id: "tier-senior", label: "Senior", price: 26 },
    ],
    availability: {
      days: ["sun"],
      startTime: "11:30",
      endTime: "15:00",
    },
    addOns: [
      { id: "addon-wine", name: "Wine pairing", price: 18 },
      { id: "addon-dessert", name: "Premium dessert platter", price: 12 },
    ],
    minGuests: 1,
    maxGuests: 12,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80",
  },
  {
    id: "buf-weekday-lunch",
    name: "Weekday Lunch Buffet",
    description: "Salads, hot mains, and daily soup. Perfect for groups and meetings.",
    pricePerPerson: 24,
    availability: {
      days: ["mon", "tue", "wed", "thu", "fri"],
      startTime: "11:30",
      endTime: "14:30",
    },
    addOns: [{ id: "addon-coffee", name: "Unlimited coffee", price: 5 }],
    minGuests: 2,
    maxGuests: 20,
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
  },
  {
    id: "buf-evening-mediterranean",
    branchId: "br-riverside",
    name: "Mediterranean Evening",
    description: "Mezze, grilled fish, and live pasta station.",
    tiers: [
      { id: "tier-adult", label: "Adult", price: 38 },
      { id: "tier-child", label: "Child", price: 19 },
    ],
    availability: {
      days: ["fri", "sat"],
      startTime: "17:30",
      endTime: "21:30",
    },
    isActive: true,
    imageUrl:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  },
];
