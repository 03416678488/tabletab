import { Globe } from "lucide-react";
import { PagePlaceholder } from "@/features/dashboard/components/page-placeholder";

export default function WebsiteSettingsPage() {
  return (
    <PagePlaceholder
      title="Website Setting"
      description="Storefront/website configuration."
      icon={Globe}
    />
  );
}
