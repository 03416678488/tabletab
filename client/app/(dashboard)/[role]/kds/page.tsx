import { KdsBoard } from "@/features/order/components/kds-board";
import { RequireBranch } from "@/features/branch/components/require-branch";

export default function KdsPage() {
  return (
    <RequireBranch feature="The kitchen display">
      <KdsBoard />
    </RequireBranch>
  );
}
