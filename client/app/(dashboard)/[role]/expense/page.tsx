import { LedgerManager } from "@/features/ledger/components/ledger-manager";
import { EXPENSE_CONFIG } from "@/features/ledger/ledger";

export default function ExpensePage() {
  return <LedgerManager config={EXPENSE_CONFIG} />;
}
