"use client";

import { ArrowRight, Building2, CheckCircle, UserCheck, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTableSkeleton,
} from "@/components/admin/admin-ui";
import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  getOwnersApi,
  getUsersApi,
  listAdminVenuesApi,
  listPendingOwnersApi,
} from "@/features/admin/admin-api";
import type { AuthUser } from "@/features/auth/types";
import type { Venue } from "@/features/venues/types";
import { getApiErrorMessage } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";

export default function AdminDashboardPage() {
  const { accessToken } = useAppSelector((state) => state.auth);

  const [pendingOwners, setPendingOwners] = useState<AuthUser[]>([]);
  const [pendingVenues, setPendingVenues] = useState<Venue[]>([]);
  const [totalOwners, setTotalOwners] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeVenuesCount, setActiveVenuesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      if (!accessToken) {
        return;
      }

      try {
        setIsLoading(true);
        const [owners, pendingVenuesData, activeVenues, allOwners, allUsers] =
          await Promise.all([
            listPendingOwnersApi(accessToken),
            listAdminVenuesApi("PENDING_APPROVAL", accessToken),
            listAdminVenuesApi("ACTIVE", accessToken),
            getOwnersApi(accessToken),
            getUsersApi(accessToken),
          ]);

        setPendingOwners(owners);
        setPendingVenues(pendingVenuesData);
        setActiveVenuesCount(activeVenues.length);
        setTotalOwners(allOwners.length);
        setTotalUsers(allUsers.length);
      } catch (error) {
        toast.error("Unable to load admin dashboard", {
          description: getApiErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadAdminData();
  }, [accessToken]);

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title="Dashboard"
            description="Overview of pending reviews, published venues, and platform accounts."
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AdminStatCard
              label="Pending owners"
              value={pendingOwners.length}
              icon={UserCheck}
              href={ROUTES.admin.pendingOwners}
              isLoading={isLoading}
            />
            <AdminStatCard
              label="Pending venues"
              value={pendingVenues.length}
              icon={Building2}
              href={ROUTES.admin.venues}
              isLoading={isLoading}
            />
            <AdminStatCard
              label="Published venues"
              value={activeVenuesCount}
              icon={CheckCircle}
              href={ROUTES.admin.venues}
              isLoading={isLoading}
            />
            <AdminStatCard
              label="Platform users"
              value={totalUsers}
              icon={Users}
              href={ROUTES.admin.users}
              isLoading={isLoading}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardQueue
              title="Owner approvals"
              description="Venue managers waiting for verification."
              emptyText="No owner applications pending."
              href={ROUTES.admin.pendingOwners}
              isLoading={isLoading}
              items={pendingOwners.slice(0, 4).map((owner) => ({
                id: owner.id,
                title: owner.fullName,
                subtitle: `${owner.ownerApplication?.businessName ?? "No business"} · ${owner.ownerApplication?.city ?? "No city"}`,
              }))}
            />

            <DashboardQueue
              title="Venue reviews"
              description="Listings submitted for approval."
              emptyText="No venues waiting for review."
              href={ROUTES.admin.venues}
              isLoading={isLoading}
              items={pendingVenues.slice(0, 4).map((venue) => ({
                id: venue.id,
                title: venue.name,
                subtitle: `${venue.city}, ${venue.state}`,
              }))}
            />
          </div>

          <AdminSection title="Quick links">
            <div className="grid gap-3 p-4 sm:grid-cols-3">
              <QuickLink
                href={ROUTES.admin.pendingOwners}
                label="Review owners"
                detail={`${pendingOwners.length} pending`}
              />
              <QuickLink
                href={ROUTES.admin.venues}
                label="Review venues"
                detail={`${pendingVenues.length} pending`}
              />
              <QuickLink
                href={ROUTES.admin.owners}
                label="Browse owners"
                detail={`${totalOwners} total`}
              />
            </div>
          </AdminSection>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}

function QuickLink({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 text-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
    >
      <div>
        <p className="font-semibold text-zinc-900 dark:text-white">{label}</p>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
      </div>
      <ArrowRight className="size-4 text-zinc-400" />
    </Link>
  );
}

type DashboardQueueProps = {
  title: string;
  description: string;
  emptyText: string;
  href: string;
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
  isLoading,
  items,
}: DashboardQueueProps) {
  return (
    <AdminSection title={title} description={description}>
      {isLoading ? (
        <AdminTableSkeleton rows={3} />
      ) : items.length === 0 ? (
        <AdminEmptyState
          icon={CheckCircle}
          title="All caught up"
          description={emptyText}
        />
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-6 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                  {item.title}
                </p>
                <p className="truncate text-xs text-zinc-500">{item.subtitle}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={href}>Review</Link>
              </Button>
            </div>
          ))}
          <div className="px-6 py-3">
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href={href}>View all</Link>
            </Button>
          </div>
        </div>
      )}
    </AdminSection>
  );
}
