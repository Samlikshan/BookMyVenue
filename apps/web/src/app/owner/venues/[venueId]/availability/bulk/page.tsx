"use client";

import { useParams } from "next/navigation";

import { RoleGuard } from "@/components/auth/role-guard";
import { OwnerLayout } from "@/components/layout/owner-layout";
import { VenueBulkAvailabilitySetup } from "@/features/venues/venue-bulk-availability-setup";
import { useAppSelector } from "@/store/hooks";

export default function BulkAvailabilitySetupPage() {
  const params = useParams();
  const venueId = String(params.venueId ?? "");
  const { accessToken } = useAppSelector((state) => state.auth);

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <OwnerLayout>
        <div className="mx-auto max-w-7xl animate-fade-in-up">
          <VenueBulkAvailabilitySetup
            venueId={venueId}
            accessToken={accessToken}
            backHref={`/owner/venues/${venueId}?tab=availability`}
          />
        </div>
      </OwnerLayout>
    </RoleGuard>
  );
}
