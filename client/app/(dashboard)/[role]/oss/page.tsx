import { OssBoard } from "@/features/order/components/oss-board";
import { RequireBranch } from "@/features/branch/components/require-branch";

export default function OssPage() {
  return (
    <RequireBranch feature="The order status screen">
      <OssBoard />
    </RequireBranch>
  );
}
