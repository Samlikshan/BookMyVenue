"use client";

import { Building2, CalendarDays, MapPin, UserCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminFilterPills,
  AdminSearchInput,
  matchesSearch,
} from "@/components/admin/admin-filters";
import { UserStatusBadge } from "@/components/admin/admin-status-badge";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTableSkeleton,
} from "@/components/admin/admin-ui";
import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { getOwnersApi } from "@/features/admin/admin-api";
import type { AuthUser, UserStatus } from "@/features/auth/types";
import { getApiErrorMessage } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";

type StatusFilter = "ALL" | UserStatus;

export default function AdminOwnersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <OwnersContent />
      </AdminLayout>
    </RoleGuard>
  );
}

function OwnersContent() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [owners, setOwners] = useState<AuthUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOwners() {
      if (!accessToken) {
        return;
      }

      try {
        setIsLoading(true);
        setOwners(await getOwnersApi(accessToken));
      } catch (error) {
        toast.error("Unable to load owners", {
          description: getApiErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadOwners();
  }, [accessToken]);

  const statusCounts = useMemo(() => {
    return owners.reduce(
      (counts, owner) => {
        counts[owner.status] += 1;
        return counts;
      },
      { ACTIVE: 0, PENDING: 0, REJECTED: 0, SUSPENDED: 0 } as Record<
        UserStatus,
        number
      >,
    );
  }, [owners]);

  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      const matchesStatus =
        statusFilter === "ALL" || owner.status === statusFilter;

      return (
        matchesStatus &&
        matchesSearch(searchQuery, [
          owner.fullName,
          owner.email,
          owner.phone,
          owner.ownerApplication?.businessName,
          owner.ownerApplication?.city,
        ])
      );
    });
  }, [owners, searchQuery, statusFilter]);

  const filterOptions: Array<{ value: StatusFilter; label: string; count?: number }> =
    [
      { value: "ALL", label: "All", count: owners.length },
      { value: "ACTIVE", label: "Active", count: statusCounts.ACTIVE },
      { value: "PENDING", label: "Pending", count: statusCounts.PENDING },
      { value: "REJECTED", label: "Rejected", count: statusCounts.REJECTED },
      { value: "SUSPENDED", label: "Suspended", count: statusCounts.SUSPENDED },
    ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Owners"
        description="All venue owner accounts and their approval status."
        count={filteredOwners.length}
        countLabel="shown"
        actions={
          <Button asChild size="sm">
            <Link href={ROUTES.admin.pendingOwners}>
              <UserCheck className="size-4" />
              Pending approvals
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <AdminFilterPills
          options={filterOptions}
          value={statusFilter}
          onChange={setStatusFilter}
        />
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search owners..."
        />
      </div>

      <AdminSection title="Owner directory">
        {isLoading ? (
          <AdminTableSkeleton rows={5} />
        ) : filteredOwners.length === 0 ? (
          <AdminEmptyState
            icon={Building2}
            title={owners.length === 0 ? "No owners yet" : "No matches found"}
            description={
              owners.length === 0
                ? "Owner accounts will appear here after registration."
                : "Try changing filters or your search term."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-6 pb-3 pt-2 font-medium">Owner</th>
                  <th className="px-6 pb-3 pt-2 font-medium">Business</th>
                  <th className="px-6 pb-3 pt-2 font-medium">City</th>
                  <th className="px-6 pb-3 pt-2 font-medium">Status</th>
                  <th className="px-6 pb-3 pt-2 font-medium">Reviewed</th>
                  <th className="px-6 pb-3 pt-2 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredOwners.map((owner) => (
                  <tr
                    key={owner.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {owner.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">{owner.email}</p>
                      <p className="text-xs text-zinc-500">{owner.phone || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                        <Building2 className="size-3.5 text-zinc-400" />
                        {owner.ownerApplication?.businessName ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="size-3.5" />
                        {owner.ownerApplication?.city ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <UserStatusBadge status={owner.status} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {owner.ownerApplication?.reviewedAt
                        ? new Date(
                            owner.ownerApplication.reviewedAt,
                          ).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {owner.ownerApplication?.createdAt
                          ? new Date(
                              owner.ownerApplication.createdAt,
                            ).toLocaleDateString()
                          : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>
    </div>
  );
}
