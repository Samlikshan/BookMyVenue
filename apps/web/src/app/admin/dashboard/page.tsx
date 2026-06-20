"use client";

import {
  Building2,
  CheckCircle,
  Clock,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  listAdminVenuesApi,
  listPendingOwnersApi,
} from "@/features/admin/admin-api";
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
      if (!accessToken) {
        return;
      }

      try {
        setIsLoading(true);
        const [owners, pendingVenuesData, activeVenues] = await Promise.all([
          listPendingOwnersApi(accessToken),
          listAdminVenuesApi("PENDING_APPROVAL", accessToken),
          listAdminVenuesApi("ACTIVE", accessToken),
        ]);

        setPendingOwners(owners);
        setPendingVenues(pendingVenuesData);
        setActiveVenuesCount(activeVenues.length);
      } catch (error) {
        console.error("Failed to load admin dashboard stats", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadAdminData();
  }, [accessToken]);

  const kpis = [
    {
      name: "Pending Owners",
      value: pendingOwners.length,
      icon: UserCheck,
      color:
        "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20",
      href: ROUTES.admin.pendingOwners,
    },
    {
      name: "Pending Venues",
      value: pendingVenues.length,
      icon: Clock,
      color:
        "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-950/20",
      href: ROUTES.admin.venues,
    },
    {
      name: "Published Venues",
      value: activeVenuesCount,
      icon: Building2,
      color:
        "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20",
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
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              System Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Audit venue listings, verify owner profiles, and publish event
              spaces.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              const cardContent = (
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                      {kpi.name}
                    </span>
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${kpi.color}`}
                    >
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
                  {cardContent}
                </Link>
              ) : (
                <div key={kpi.name}>{cardContent}</div>
              );
            })}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <DashboardQueue
              title="Pending Owners"
              description="Venue managers awaiting verification."
              emptyText="All owner applications reviewed."
              href={ROUTES.admin.pendingOwners}
              actionLabel="Review"
              isLoading={isLoading}
              items={pendingOwners.slice(0, 3).map((owner) => ({
                id: owner.id,
                title: owner.fullName,
                subtitle: `${owner.ownerApplication?.businessName || "No business name"} • ${owner.ownerApplication?.city || "No city"}`,
              }))}
            />

            <DashboardQueue
              title="Pending Venues"
              description="Event spaces submitted for audit."
              emptyText="All venue listings reviewed."
              href={ROUTES.admin.venues}
              actionLabel="Audit"
              isLoading={isLoading}
              items={pendingVenues.slice(0, 3).map((venue) => ({
                id: venue.id,
                title: venue.name,
                subtitle: `${venue.city}, ${venue.state}`,
              }))}
            />
          </div>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}

type DashboardQueueProps = {
  title: string;
  description: string;
  emptyText: string;
  href: string;
  actionLabel: string;
  isLoading: boolean;
  items: Array<{
    id: string;
    title: string;
    subtitle: string;
  }>;
};

function DashboardQueue({
  title,
  description,
  emptyText,
  href,
  actionLabel,
  isLoading,
  items,
}: DashboardQueueProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            {title}
          </h3>
          <p className="text-2xs text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href={href}>View Queue</Link>
        </Button>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-14 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-sm text-zinc-400">
            <CheckCircle className="mx-auto mb-2 size-8 text-emerald-500" />
            {emptyText}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-zinc-100 p-4 dark:border-zinc-800"
              >
                <div>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-2xs text-zinc-500">{item.subtitle}</p>
                </div>
                <Button asChild size="sm" variant="outline" className="h-8 text-2xs">
                  <Link href={href}>{actionLabel}</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
