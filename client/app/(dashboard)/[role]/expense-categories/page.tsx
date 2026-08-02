import { LedgerCategoryManager } from "@/features/ledger/components/ledger-category-manager";
import { EXPENSE_CONFIG } from "@/features/ledger/ledger";

export default function ExpenseCategoriesPage() {
  return <LedgerCategoryManager config={EXPENSE_CONFIG} />;
}
