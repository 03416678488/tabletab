export type RegisterStatus = "open" | "closed";

export interface RegisterSession {
  id: string;
  status: RegisterStatus;
  openingBalance: number;
  closingCountedBalance: number | null;
  expectedBalance: number | null;
  variance: number | null;
  note: string | null;
  openedBy: string | null;
  openedAt: string;
  closedAt: string | null;
}

export interface RegisterSummary {
  expectedCash: number;
  cashSales: number;
  cardSales: number;
  mfsSales: number;
  otherSales: number;
  cashIn: number;
  cashOut: number;
  refunds: number;
  salesTotal: number;
  salesCount: number;
}

export interface CurrentRegister {
  session: RegisterSession | null;
  summary: RegisterSummary | null;
}
