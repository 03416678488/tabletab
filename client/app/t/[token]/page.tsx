"use client";

import { use } from "react";
import { VenueMenu } from "@/features/venue/components/venue-menu";

export default function VenueMenuPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  return <VenueMenu token={token} />;
}
