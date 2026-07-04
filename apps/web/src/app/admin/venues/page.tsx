"use client";

import {
  Building2,
  Check,
  Eye,
  MapPin,
  Star,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminFilterPills,
  AdminSearchInput,
  matchesSearch,
} from "@/components/admin/admin-filters";
import { VenueStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminRejectModal } from "@/components/admin/admin-stat-card";
import {
  AdminCardSkeleton,
  AdminEmptyState,
  AdminPageHeader,
} from "@/components/admin/admin-ui";
import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  approveVenueApi,
  listAdminVenuesApi,
  rejectVenueApi,
} from "@/features/admin/admin-api";
import type { Venue } from "@/features/venues/types";
import { getApiErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

type VenueTab = "PENDING_APPROVAL" | "ACTIVE" | "REJECTED" | "ALL";

const tabOptions: Array<{ value: VenueTab; label: string }> = [
  { value: "PENDING_APPROVAL", label: "Pending" },
  { value: "ACTIVE", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ALL", label: "All" },
];

export default function AdminVenuesPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <AdminVenuesContent />
      </AdminLayout>
    </RoleGuard>
  );
}

function AdminVenuesContent() {
  const { accessToken } = useAppSelector((state) => state.auth);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [activeTab, setActiveTab] = useState<VenueTab>("PENDING_APPROVAL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [rejectingVenue, setRejectingVenue] = useState<Venue | null>(null);
  const [actionVenueId, setActionVenueId] = useState<string | null>(null);

  async function loadVenues(tab: VenueTab) {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const status = tab === "ALL" ? null : tab;
      setVenues(await listAdminVenuesApi(status, accessToken));
    } catch (error) {
      toast.error("Unable to load venues", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadVenues(activeTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, activeTab]);

  const filteredVenues = useMemo(
    () =>
      venues.filter((venue) =>
        matchesSearch(searchQuery, [
          venue.name,
          venue.city,
          venue.state,
          venue.shortDescription,
          venue.addressLine1,
        ]),
      ),
    [searchQuery, venues],
  );

  const isPendingView = activeTab === "PENDING_APPROVAL";

  async function handleApprove(venue: Venue) {
    if (!accessToken) {
      return;
    }

    try {
      setActionVenueId(venue.id);
      const result = await approveVenueApi(venue.id, accessToken);
      if (result) {
        toast.success(`Published ${venue.name}`);
        setVenues((prev) => prev.filter((item) => item.id !== venue.id));
        setSelectedVenue(null);
      }
    } catch (error) {
      toast.error("Approval failed", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setActionVenueId(null);
    }
  }

  async function handleReject(reason: string) {
    if (!accessToken || !rejectingVenue) {
      return;
    }

    try {
      setActionVenueId(rejectingVenue.id);
      const result = await rejectVenueApi(
        rejectingVenue.id,
        reason,
        accessToken,
      );
      if (result) {
        toast.success(`Rejected ${rejectingVenue.name}`);
        setVenues((prev) => prev.filter((item) => item.id !== rejectingVenue.id));
        setRejectingVenue(null);
        setSelectedVenue(null);
      }
    } catch (error) {
      toast.error("Rejection failed", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setActionVenueId(null);
    }
  }

  return (
    <>
      <div className="space-y-6">
        <AdminPageHeader
          title="Venues"
          description="Review listings, publish approved venues, and manage rejected submissions."
          count={filteredVenues.length}
          countLabel="shown"
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <AdminFilterPills
            options={tabOptions}
            value={activeTab}
            onChange={setActiveTab}
          />
          <AdminSearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search venues..."
          />
        </div>

        {isLoading ? (
          <AdminCardSkeleton count={6} />
        ) : filteredVenues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900/50">
            <AdminEmptyState
              icon={Building2}
              title={venues.length === 0 ? "No venues here" : "No matches found"}
              description={
                venues.length === 0
                  ? isPendingView
                    ? "No venues are waiting for review right now."
                    : "No venues match this filter."
                  : "Try a different search term."
              }
            />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredVenues.map((venue) => {
              const primaryImage =
                venue.images?.find((img) => img.isPrimary) ??
                venue.images?.[0];

              return (
                <article
                  key={venue.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="relative h-44 bg-zinc-100 dark:bg-zinc-800">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.imageUrl}
                        alt={venue.name}
                        fill
                        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-400">
                        <Building2 className="size-10" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3">
                      <VenueStatusBadge status={venue.status} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-1 text-base font-semibold text-zinc-900 dark:text-white">
                      {venue.name}
                    </h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                      <MapPin className="size-3.5 shrink-0" />
                      {venue.city}, {venue.state}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {venue.shortDescription || "No short description provided."}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                      <Users className="size-3.5" />
                      {venue.capacityMin && venue.capacityMax
                        ? `${venue.capacityMin}–${venue.capacityMax} guests`
                        : "Capacity not set"}
                    </p>

                    <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => setSelectedVenue(venue)}
                      >
                        <Eye className="size-4" />
                        View details
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {selectedVenue ? (
        <VenueReviewModal
          venue={selectedVenue}
          isPending={selectedVenue.status === "PENDING_APPROVAL"}
          isSubmitting={actionVenueId === selectedVenue.id}
          onClose={() => setSelectedVenue(null)}
          onApprove={() => void handleApprove(selectedVenue)}
          onReject={() => {
            setRejectingVenue(selectedVenue);
          }}
        />
      ) : null}

      {rejectingVenue ? (
        <AdminRejectModal
          title={`Reject ${rejectingVenue.name}?`}
          description="The owner will see this reason on their venue listing."
          submitLabel="Reject venue"
          isSubmitting={actionVenueId === rejectingVenue.id}
          onClose={() => setRejectingVenue(null)}
          onSubmit={handleReject}
        />
      ) : null}
    </>
  );
}

type VenueReviewModalProps = {
  venue: Venue;
  isPending: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
};

function VenueReviewModal({
  venue,
  isPending,
  isSubmitting,
  onClose,
  onApprove,
  onReject,
}: VenueReviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-start justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
              {venue.name}
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {venue.city}, {venue.state}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Photos
            </h3>
            {venue.images?.length ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                {venue.images.map((image) => (
                  <div
                    key={image.id}
                    className="relative h-28 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
                  >
                    <Image
                      src={image.imageUrl}
                      alt={venue.name}
                      fill
                      sizes="160px"
                      className="object-cover"
                    />
                    {image.isPrimary ? (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-zinc-900/85 px-2 py-0.5 text-[10px] font-semibold text-white">
                        <Star className="size-2.5 fill-white" />
                        Primary
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-zinc-500">No photos uploaded.</p>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-4 md:col-span-2">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Short description
                </h3>
                <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {venue.shortDescription || "—"}
                </p>
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Full description
                </h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                  {venue.description || "—"}
                </p>
              </div>
            </div>

            <div className="space-y-4 rounded-xl bg-zinc-50 p-4 text-sm dark:bg-zinc-800/50">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Status
                </p>
                <div className="mt-1">
                  <VenueStatusBadge status={venue.status} />
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Capacity
                </p>
                <p className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">
                  {venue.capacityMin && venue.capacityMax
                    ? `${venue.capacityMin}–${venue.capacityMax} guests`
                    : "Not specified"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Address
                </p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {venue.addressLine1}
                  {venue.addressLine2 ? `, ${venue.addressLine2}` : ""}
                  <br />
                  {venue.city}, {venue.state}
                  {venue.postalCode ? ` ${venue.postalCode}` : ""}
                  <br />
                  {venue.country}
                </p>
              </div>
              {venue.rejectionReason ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Rejection reason
                  </p>
                  <p className="mt-1 text-red-600 dark:text-red-400">
                    {venue.rejectionReason}
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Event types
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {venue.eventTypes?.length ? (
                  venue.eventTypes.map((entry) => (
                    <span
                      key={entry.eventTypeId}
                      className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {entry.eventType.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">None listed</span>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Amenities
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {venue.amenities?.length ? (
                  venue.amenities.map((amenity) => (
                    <span
                      key={amenity.id}
                      className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                      {amenity.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-zinc-500">None listed</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/80">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {isPending ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={onReject}
                className="text-red-600 hover:text-red-700"
              >
                Reject
              </Button>
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={onApprove}
                className="gap-1.5"
              >
                <Check className="size-4" />
                {isSubmitting ? "Publishing..." : "Publish venue"}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
