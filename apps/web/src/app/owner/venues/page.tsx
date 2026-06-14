"use client";

import {
  AlertCircle,
  Building2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { OwnerLayout } from "@/components/layout/owner-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteVenueApi, listMyVenuesApi } from "@/features/venues/venues-api";
import type { Venue, VenueStatus } from "@/features/venues/types";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";

export default function OwnerVenuesPage() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | VenueStatus>("ALL");

  async function loadVenues() {
    if (!accessToken) return;
    try {
      const data = await listMyVenuesApi(accessToken);
      setVenues(data);
    } catch (error) {
      console.error("Failed to load venues", error);
      toast.error("Failed to load venues");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadVenues();
  }, [accessToken]);

  async function handleDelete(venueId: string, name: string) {
    if (!accessToken) return;
    const confirmed = window.confirm(`Are you sure you want to delete "${name}"?`);
    if (!confirmed) return;

    try {
      const success = await deleteVenueApi(venueId, accessToken);
      if (success) {
        toast.success("Venue deleted successfully");
        setVenues((prev) => prev.filter((v) => v.id !== venueId));
      } else {
        toast.error("Failed to delete venue");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete venue");
    }
  }

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch =
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (venue.state && venue.state.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || venue.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const filterTabs: { label: string; value: "ALL" | VenueStatus }[] = [
    { label: "All Venues", value: "ALL" },
    { label: "Active", value: "ACTIVE" },
    { label: "Pending Review", value: "PENDING_APPROVAL" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Rejected", value: "REJECTED" },
  ];

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <OwnerLayout>
        <div className="space-y-8 animate-fade-in-up">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                My Venues
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create and manage your event spaces and listings.
              </p>
            </div>
            <Link href={ROUTES.owner.createVenue}>
              <Button className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-sm">
                <Plus className="size-4" />
                Create Venue
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative w-full max-w-md">
              <Search className="absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search venues by name, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 border-zinc-200 focus-visible:ring-zinc-900 dark:border-zinc-800 dark:focus-visible:ring-zinc-100"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
              {filterTabs.map((tab) => (
                <button
                  key={tab.label}
                  onClick={() => setStatusFilter(tab.value)}
                  className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    statusFilter === tab.value
                      ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listings Grid */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-80 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </div>
          ) : filteredVenues.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10">
              <div className="flex size-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
                <Building2 className="size-7" />
              </div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white">No venues match search</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                Try revising your query or filters, or add a new venue listing.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredVenues.map((venue) => {
                const primaryImage = venue.images?.find((img) => img.isPrimary)?.imageUrl;
                const isDraft = venue.status === "DRAFT";
                const isActive = venue.status === "ACTIVE";
                const isPending = venue.status === "PENDING_APPROVAL";
                const isRejected = venue.status === "REJECTED";

                return (
                  <div
                    key={venue.id}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-md dark:border-zinc-850 dark:bg-zinc-900/50"
                  >
                    {/* Media Thumbnail */}
                    <div className="relative h-48 bg-zinc-100 dark:bg-zinc-800">
                      {primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={primaryImage}
                          alt={venue.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-zinc-400">
                          <Building2 className="size-12" />
                        </div>
                      )}

                      {/* Status Overlay Badge */}
                      <div className="absolute top-4 left-4">
                        {isActive && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500 px-2.5 py-0.5 text-2xs font-bold uppercase text-white shadow-sm">
                            Active
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-2xs font-bold uppercase text-white shadow-sm">
                            Pending Review
                          </span>
                        )}
                        {isDraft && (
                          <span className="inline-flex items-center rounded-full bg-zinc-655 px-2.5 py-0.5 text-2xs font-bold uppercase text-white shadow-sm">
                            Draft
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-0.5 text-2xs font-bold uppercase text-white shadow-sm">
                            <AlertCircle className="size-3" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Content */}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex-1 space-y-3">
                        <h3 className="line-clamp-1 text-lg font-bold text-zinc-900 transition-colors group-hover:text-zinc-600 dark:text-white dark:group-hover:text-zinc-350">
                          {venue.name}
                        </h3>

                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <MapPin className="size-3.5 shrink-0" />
                          <span className="truncate">
                            {venue.addressLine1}, {venue.city}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                          <Users className="size-3.5 shrink-0" />
                          <span>
                            Capacity:{" "}
                            {venue.capacityMin && venue.capacityMax
                              ? `${venue.capacityMin} - ${venue.capacityMax}`
                              : "Not configured"}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                        <Link href={`${ROUTES.owner.venues}/${venue.id}`} className="flex-1">
                          <Button variant="outline" className="w-full h-9 text-xs border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-850">
                            Manage Venue
                          </Button>
                        </Link>
                        {isDraft || isRejected ? (
                          <Button
                            onClick={() => handleDelete(venue.id, venue.name)}
                            variant="outline"
                            size="icon"
                            className="size-9 border-zinc-200 text-zinc-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:border-zinc-800 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </OwnerLayout>
    </RoleGuard>
  );
}
