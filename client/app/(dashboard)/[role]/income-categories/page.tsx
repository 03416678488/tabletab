import { LedgerCategoryManager } from "@/features/ledger/components/ledger-category-manager";
import { INCOME_CONFIG } from "@/features/ledger/ledger";

export default function IncomeCategoriesPage() {
  return <LedgerCategoryManager config={INCOME_CONFIG} />;
}
