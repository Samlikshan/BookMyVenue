"use client";

import {
  Building2,
  Check,
  Clock,
  Eye,
  MapPin,
  Star,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  approveVenueApi,
  listAdminVenuesApi,
  rejectVenueApi,
} from "@/features/admin/admin-api";
import type { Venue } from "@/features/venues/types";
import { useAppSelector } from "@/store/hooks";

export default function AdminVenuesQueuePage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <AdminVenuesQueueContent />
      </AdminLayout>
    </RoleGuard>
  );
}

function AdminVenuesQueueContent() {
  const { accessToken } = useAppSelector((state) => state.auth);

  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  async function loadPendingVenues() {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await listAdminVenuesApi("PENDING_APPROVAL", accessToken);
      setVenues(data);
    } catch (error) {
      console.error("Failed to load pending venues", error);
      toast.error("Failed to load queue");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPendingVenues();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleApprove(venueId: string, name: string) {
    if (!accessToken) return;
    const confirmed = window.confirm(`Approve listing for "${name}"?`);
    if (!confirmed) return;

    try {
      const result = await approveVenueApi(venueId, accessToken);
      if (result) {
        toast.success(`Approved venue: ${name}`);
        setVenues((prev) => prev.filter((v) => v.id !== venueId));
        setSelectedVenue(null);
      }
    } catch {
      toast.error("Failed to approve venue");
    }
  }

  async function handleReject(venueId: string, name: string) {
    if (!accessToken) return;
    const reason = window.prompt(`Enter rejection reason for "${name}":`);
    if (reason === null) return;
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      const result = await rejectVenueApi(venueId, trimmed, accessToken);
      if (result) {
        toast.success(`Rejected venue: ${name}`);
        setVenues((prev) => prev.filter((v) => v.id !== venueId));
        setSelectedVenue(null);
      }
    } catch {
      toast.error("Failed to reject venue");
    }
  }

  return (
    <>
      <div className="space-y-8 animate-fade-in-up">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Venues Verification Queue
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Audit venue listings, verify description credentials, and evaluate visual media prior to publishing.
            </p>
          </div>

          {/* Venues Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
              ))}
            </div>
          ) : venues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10">
              <div className="flex size-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
                <Building2 className="size-7" />
              </div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Queue Empty</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                No venues are currently pending review. Verified spaces are active and searchable.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {venues.map((venue) => {
                const primaryImage = venue.images?.find((img) => img.isPrimary)?.imageUrl;
                return (
                  <div
                    key={venue.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-850 dark:bg-zinc-900/50"
                  >
                    <div className="relative h-44 bg-zinc-100 dark:bg-zinc-850">
                      {primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={primaryImage} alt={venue.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                          <Building2 className="size-10" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-2xs font-bold uppercase text-white shadow-xs">
                          <Clock className="size-3" />
                          Pending Audit
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex-1 space-y-2.5">
                        <h3 className="line-clamp-1 text-base font-bold text-zinc-900 dark:text-white">
                          {venue.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">{venue.city}, {venue.state}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <Users className="size-3.5 shrink-0" />
                          <span>Capacity: {venue.capacityMin} - {venue.capacityMax} guests</span>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800 flex justify-end">
                        <Button
                          onClick={() => setSelectedVenue(venue)}
                          className="w-full gap-2 h-9 text-xs"
                        >
                          <Eye className="size-4" />
                          Review Listing
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* Audit Modal Overlay */}
      {selectedVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-scale-up">
              
              {/* Modal Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-100 bg-white/95 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/95">
                <div>
                  <h3 className="text-xl font-bold text-zinc-950 dark:text-white">{selectedVenue.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Pending approval audit dashboard</p>
                </div>
                <button
                  onClick={() => setSelectedVenue(null)}
                  className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="size-5.5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                
                {/* Image Gallery */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Venue Media</h4>
                  {selectedVenue.images?.length === 0 ? (
                    <p className="text-xs text-zinc-500">No photos uploaded.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {selectedVenue.images?.map((img) => (
                        <div key={img.id} className="relative h-28 overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.imageUrl} alt="Review thumbnail" className="h-full w-full object-cover" />
                          {img.isPrimary && (
                            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-zinc-950/85 px-1.5 py-0.5 text-3xs font-bold text-yellow-400">
                              <Star className="size-2.5 fill-yellow-400" />
                              Primary
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Short Description</h4>
                      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {selectedVenue.shortDescription || "No short description provided."}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Full Description</h4>
                      <p className="text-xs leading-5 text-zinc-655 dark:text-zinc-400 whitespace-pre-line">
                        {selectedVenue.description || "No full description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-850/40 text-xs">
                    <div>
                      <h5 className="font-bold text-zinc-400 uppercase tracking-wider text-2xs">Capacity Range</h5>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {selectedVenue.capacityMin} - {selectedVenue.capacityMax} attendees
                      </p>
                    </div>

                    <div className="border-t border-zinc-200/50 pt-3 dark:border-zinc-800">
                      <h5 className="font-bold text-zinc-400 uppercase tracking-wider text-2xs">Location Address</h5>
                      <p className="text-zinc-655 dark:text-zinc-350 mt-0.5 leading-4">
                        {selectedVenue.addressLine1}
                        {selectedVenue.addressLine2 && `, ${selectedVenue.addressLine2}`}
                        <br />
                        {selectedVenue.city}, {selectedVenue.state}
                        {selectedVenue.postalCode && ` - ${selectedVenue.postalCode}`}
                        <br />
                        {selectedVenue.country}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Categories & Amenities */}
                <div className="grid gap-6 md:grid-cols-2 border-t border-zinc-100 pt-5 dark:border-zinc-800">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Supported Event Categories</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVenue.eventTypes?.map((et) => (
                        <span key={et.eventTypeId} className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-2xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                          {et.eventType.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Amenities Provided</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedVenue.amenities?.map((amenity) => (
                        <span key={amenity.id} className="inline-flex rounded-md bg-zinc-100 px-2 py-1 text-2xs font-bold text-zinc-855 dark:bg-zinc-800 dark:text-zinc-200">
                          {amenity.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="sticky bottom-0 border-t border-zinc-100 bg-zinc-50 px-6 py-4 flex items-center justify-end gap-3 dark:border-zinc-800 dark:bg-zinc-850/60">
                <Button
                  onClick={() => setSelectedVenue(null)}
                  variant="outline"
                  className="h-9 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleReject(selectedVenue.id, selectedVenue.name)}
                  variant="outline"
                  className="h-9 border-zinc-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-xs px-4 dark:border-zinc-800 dark:hover:bg-rose-955/20"
                >
                  Reject Venue
                </Button>
                <Button
                  onClick={() => handleApprove(selectedVenue.id, selectedVenue.name)}
                  className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                >
                  <Check className="size-4" />
                  Approve Listing
                </Button>
              </div>

            </div>
        </div>
      )}
    </>
  );
}
