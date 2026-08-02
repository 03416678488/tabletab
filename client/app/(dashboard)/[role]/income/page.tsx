import { LedgerManager } from "@/features/ledger/components/ledger-manager";
import { INCOME_CONFIG } from "@/features/ledger/ledger";

export default function IncomePage() {
  return <LedgerManager config={INCOME_CONFIG} />;
}
