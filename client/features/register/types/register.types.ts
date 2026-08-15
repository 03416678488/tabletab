export type RegisterStatus = "open" | "closed";

export interface RegisterSession {
  id: string;
  status: RegisterStatus;
  branchId: string | null;
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

/** One branch's drawer state in the "All branches" overview. */
export interface RegisterOverviewRow {
  branchId: string;
  branchName: string;
  status: RegisterStatus;
  openingBalance: number | null;
  expectedCash: number | null;
  cashSales: number | null;
  cashIn: number | null;
  cashOut: number | null;
  openedAt: string | null;
}

export interface RegisterOverview {
  rows: RegisterOverviewRow[];
  totals: { openDrawers: number; expectedCash: number };
}
