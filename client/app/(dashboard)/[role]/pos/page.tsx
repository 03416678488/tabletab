import { PosTerminal } from "@/features/order/components/pos-terminal";
import { RequireBranch } from "@/features/branch/components/require-branch";

export default function PosPage() {
  return (
    <RequireBranch feature="The POS">
      <PosTerminal />
    </RequireBranch>
  );
}
