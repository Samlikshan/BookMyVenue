"use client";

import {
  Building2,
  CheckCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { listPendingOwnersApi, listAdminVenuesApi } from "@/features/admin/admin-api";
import type { AuthUser } from "@/features/auth/types";
import type { Venue } from "@/features/venues/types";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";

export default function AdminDashboardPage() {
  const { accessToken } = useAppSelector((state) => state.auth);

  const [pendingOwners, setPendingOwners] = useState<AuthUser[]>([]);
  const [pendingVenues, setPendingVenues] = useState<Venue[]>([]);
  const [activeVenuesCount, setActiveVenuesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      if (!accessToken) return;
      try {
        const owners = await listPendingOwnersApi(accessToken);
        setPendingOwners(owners);

        const pVenues = await listAdminVenuesApi("PENDING_APPROVAL", accessToken);
        setPendingVenues(pVenues);

        const aVenues = await listAdminVenuesApi("ACTIVE", accessToken);
        setActiveVenuesCount(aVenues.length);
      } catch (error) {
        console.error("Failed to load admin dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadAdminData();
  }, [accessToken]);

  const kpis = [
    {
      name: "Pending Owners",
      value: pendingOwners.length,
      icon: UserCheck,
      color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20",
      href: ROUTES.admin.pendingOwners,
    },
    {
      name: "Pending Venues",
      value: pendingVenues.length,
      icon: Clock,
      color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/20",
      href: ROUTES.admin.venues,
    },
    {
      name: "Published Venues",
      value: activeVenuesCount,
      icon: Building2,
      color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20",
      href: ROUTES.admin.venues,
    },
    {
      name: "Verification Admin",
      value: "Root Console",
      icon: ShieldCheck,
      color: "text-zinc-600 bg-zinc-100 dark:text-zinc-300 dark:bg-zinc-800",
    },
  ];

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8 animate-fade-in-up">
          {/* Welcome Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              System Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Audit venue listings, verify owner profiles, and publish events spaces.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              const CardContent = (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {kpi.name}
                    </span>
                    <div className={`flex size-10 items-center justify-center rounded-xl ${kpi.color}`}>
                      <Icon className="size-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    {isLoading && typeof kpi.value === "number" ? (
                      <div className="h-9 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                    ) : (
                      <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
                        {kpi.value}
                      </span>
                    )}
                  </div>
                </div>
              );

              return kpi.href ? (
                <Link key={kpi.name} href={kpi.href}>
                  {CardContent}
                </Link>
              ) : (
                <div key={kpi.name}>{CardContent}</div>
              );
            })}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Queue: Pending Owners */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50 overflow-hidden">
              <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Pending Owners
                  </h3>
                  <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                    Venue managers awaiting verification.
                  </p>
                </div>
                <Link href={ROUTES.admin.pendingOwners}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Queue
                  </Button>
                </Link>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-14 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                    ))}
                  </div>
                ) : pendingOwners.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-sm">
                    <CheckCircle className="size-8 mx-auto text-emerald-500 mb-2" />
                    All owner applications reviewed.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingOwners.slice(0, 3).map((owner) => (
                      <div
                        key={owner.id}
                        className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 dark:border-zinc-800"
                      >
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">
                            {owner.fullName}
                          </p>
                          <p className="text-2xs text-zinc-500">
                            {owner.ownerApplication?.businessName || "No business name"} • {owner.ownerApplication?.city}
                          </p>
                        </div>
                        <Link href={ROUTES.admin.pendingOwners}>
                          <Button size="sm" variant="outline" className="text-2xs h-8">
                            Review
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Queue: Pending Venues */}
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50 overflow-hidden">
              <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Pending Venues
                  </h3>
                  <p className="text-2xs text-zinc-500 dark:text-zinc-400">
                    Event spaces submitted for audit.
                  </p>
                </div>
                <Link href={ROUTES.admin.venues}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    View Queue
                  </Button>
                </Link>
              </div>

              <div className="p-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-14 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                    ))}
                  </div>
                ) : pendingVenues.length === 0 ? (
                  <div className="text-center py-8 text-zinc-400 text-sm">
                    <CheckCircle className="size-8 mx-auto text-emerald-500 mb-2" />
                    All venue listings reviewed.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingVenues.slice(0, 3).map((venue) => (
                      <div
                        key={venue.id}
                        className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 dark:border-zinc-800"
                      >
                        <div>
                          <p className="text-sm font-bold text-zinc-900 dark:text-white">
                            {venue.name}
                          </p>
                          <p className="text-2xs text-zinc-500">
                            {venue.city}, {venue.state}
                          </p>
                        </div>
                        <Link href={ROUTES.admin.venues}>
                          <Button size="sm" variant="outline" className="text-2xs h-8">
                            Audit
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
