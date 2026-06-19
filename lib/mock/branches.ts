import type { Branch, Table } from "@/lib/types";

const tablesFor = (
  branchId: string,
  defs: { label: string; floor: string; seats: number; token: string; status?: Table["status"] }[],
): Table[] =>
  defs.map((d, i) => ({
    id: `${branchId}-t${i + 1}`,
    branchId,
    label: d.label,
    floor: d.floor,
    seats: d.seats,
    qrToken: d.token,
    status: d.status ?? "available",
  }));

export const branches: Branch[] = [
  {
    id: "br-riverside",
    name: "Olive & Ash — Riverside",
    address: "14 Quay Street",
    city: "Portland",
    phone: "+1 (503) 555-0142",
    imageUrl: "https://picsum.photos/seed/tabletap-riverside/1200/640",
    isOpen: true,
    floors: ["Main Floor", "Terrace"],
    tables: tablesFor("br-riverside", [
      { label: "T1", floor: "Main Floor", seats: 2, token: "qr_8f3a1c7d9e", status: "seated" },
      { label: "T2", floor: "Main Floor", seats: 2, token: "qr_2b6d4f0a11" },
      { label: "T3", floor: "Main Floor", seats: 4, token: "qr_7c1e9a3b5d", status: "needs-service" },
      { label: "T4", floor: "Main Floor", seats: 4, token: "qr_5a9f2c8e6b" },
      { label: "T5", floor: "Main Floor", seats: 6, token: "qr_1d4b7e2f90" },
      { label: "P1", floor: "Terrace", seats: 2, token: "qr_3e8c1a6d42", status: "seated" },
      { label: "P2", floor: "Terrace", seats: 4, token: "qr_9b2f5d7c83" },
      { label: "P3", floor: "Terrace", seats: 4, token: "qr_6a0e3c9b17" },
    ]),
  },
  {
    id: "br-uptown",
    name: "Olive & Ash — Uptown",
    address: "208 Birch Avenue",
    city: "Portland",
    phone: "+1 (503) 555-0188",
    imageUrl: "https://picsum.photos/seed/tabletap-uptown/1200/640",
    isOpen: false,
    floors: ["Ground", "Mezzanine"],
    tables: tablesFor("br-uptown", [
      { label: "A1", floor: "Ground", seats: 2, token: "qr_4c7a1f9e22" },
      { label: "A2", floor: "Ground", seats: 2, token: "qr_8d3b6e0a55", status: "seated" },
      { label: "A3", floor: "Ground", seats: 4, token: "qr_2f9c4a7d18" },
      { label: "A4", floor: "Ground", seats: 4, token: "qr_7b1e8c3f90" },
      { label: "M1", floor: "Mezzanine", seats: 6, token: "qr_5e2a9d6c41" },
      { label: "M2", floor: "Mezzanine", seats: 8, token: "qr_1a8f3c5b72", status: "inactive" },
    ]),
  },
];
