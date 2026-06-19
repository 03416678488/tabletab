import type { CustomerAccount, StaffUser } from "@/lib/types";

const avatar = (seed: string) =>
  `https://i.pravatar.cc/120?u=tabletap-${seed}`;

export const staffUsers: StaffUser[] = [
  {
    id: "su-owner",
    name: "Dana Whitfield",
    email: "dana@oliveandash.com",
    role: "owner",
    branchIds: ["br-riverside", "br-uptown"],
    avatarUrl: avatar("owner"),
  },
  {
    id: "su-manager",
    name: "Marcus Lee",
    email: "marcus@oliveandash.com",
    role: "manager",
    branchIds: ["br-riverside"],
    avatarUrl: avatar("manager"),
  },
  {
    id: "su-chef",
    name: "Sofia Romano",
    email: "sofia@oliveandash.com",
    role: "chef",
    branchIds: ["br-riverside"],
    avatarUrl: avatar("chef"),
  },
  {
    id: "su-waiter",
    name: "Theo Nguyen",
    email: "theo@oliveandash.com",
    role: "waiter",
    branchIds: ["br-riverside"],
    avatarUrl: avatar("waiter"),
  },
];

export const customerAccount: CustomerAccount = {
  id: "cu-1",
  name: "Jordan Avery",
  email: "jordan.avery@example.com",
  phone: "+1 (503) 555-0110",
  addresses: [
    {
      id: "addr-1",
      label: "Home",
      line1: "92 Maple Court",
      city: "Portland",
      postalCode: "97204",
      isDefault: true,
    },
    {
      id: "addr-2",
      label: "Work",
      line1: "500 Commerce Tower",
      line2: "Floor 12",
      city: "Portland",
      postalCode: "97209",
      isDefault: false,
    },
  ],
};
