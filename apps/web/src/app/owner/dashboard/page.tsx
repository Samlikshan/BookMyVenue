"use client";

import {
  AlertCircle,
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { OwnerLayout } from "@/components/layout/owner-layout";
import { Button } from "@/components/ui/button";
import { listMyVenuesApi } from "@/features/venues/venues-api";
import type { Venue } from "@/features/venues/types";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";

export default function OwnerDashboardPage() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      if (!accessToken) return;
      try {
        const data = await listMyVenuesApi(accessToken);
        setVenues(data);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadDashboardData();
  }, [accessToken]);

  const totalCount = venues.length;
  const activeCount = venues.filter((v) => v.status === "ACTIVE").length;
  const pendingCount = venues.filter((v) => v.status === "PENDING_APPROVAL").length;
  const draftCount = venues.filter((v) => v.status === "DRAFT").length;
  const rejectedCount = venues.filter((v) => v.status === "REJECTED").length;

  const kpis = [
    {
      name: "Total Venues",
      value: totalCount,
      icon: Building2,
      color: "text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800",
    },
    {
      name: "Active Venues",
      value: activeCount,
      icon: CheckCircle,
      color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20",
    },
    {
      name: "Pending Approval",
      value: pendingCount,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20",
    },
    {
      name: "Drafts / Rejected",
      value: draftCount + rejectedCount,
      icon: FileText,
      color: "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20",
    },
  ];

  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <OwnerLayout>
        <div className="space-y-8 animate-fade-in-up">
          {/* Welcome Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Monitor your listings, stats, and verification workflow.
              </p>
            </div>
            <Link href={ROUTES.owner.createVenue}>
              <Button className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-sm">
                <Plus className="size-4" />
                Add Venue
              </Button>
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.name}
                  className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {kpi.name}
                    </span>
                    <div className={`flex size-10 items-center justify-center rounded-xl ${kpi.color}`}>
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    {isLoading ? (
                      <div className="h-9 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    ) : (
                      <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        {kpi.value}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Listings Section */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50 overflow-hidden">
            <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Recent Listings
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Your latest created venues.
              </p>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                  ))}
                </div>
              ) : venues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mb-4">
                    <Building2 className="size-6" />
                  </div>
                  <h4 className="text-base font-semibold text-zinc-900 dark:text-white">No venues found</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                    You haven&apos;t added any venues to the platform yet. Click &quot;Add Venue&quot; above to create your first listing.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        <th className="pb-3 font-semibold">Name</th>
                        <th className="pb-3 font-semibold">Location</th>
                        <th className="pb-3 font-semibold">Capacity</th>
                        <th className="pb-3 font-semibold">Status</th>
                        <th className="pb-3 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                      {venues.slice(0, 5).map((venue) => {
                        const isDraft = venue.status === "DRAFT";
                        const isActive = venue.status === "ACTIVE";
                        const isPending = venue.status === "PENDING_APPROVAL";
                        const isRejected = venue.status === "REJECTED";

                        return (
                          <tr key={venue.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                            <td className="py-4 font-semibold text-zinc-900 dark:text-white">
                              {venue.name}
                            </td>
                            <td className="py-4 text-zinc-655 dark:text-zinc-400">
                              {venue.city}, {venue.state}
                            </td>
                            <td className="py-4 text-zinc-600 dark:text-zinc-400">
                              {venue.capacityMin && venue.capacityMax
                                ? `${venue.capacityMin} - ${venue.capacityMax}`
                                : "Not Set"}
                            </td>
                            <td className="py-4">
                              {isActive && (
                                <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/20">
                                  Active
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20">
                                  Pending Review
                                </span>
                              )}
                              {isDraft && (
                                <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/50">
                                  Draft
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/20">
                                  <AlertCircle className="size-3" />
                                  Rejected
                                </span>
                              )}
                            </td>
                            <td className="py-4 text-right">
                              <Link href={`${ROUTES.owner.venues}/${venue.id}`}>
                                <Button variant="ghost" size="sm" className="hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                  Manage
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </OwnerLayout>
    </RoleGuard>
  );
}
