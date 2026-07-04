"use client";

import { CalendarDays, Users } from "lucide-react";
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
import { getUsersApi } from "@/features/admin/admin-api";
import type { AuthUser, UserStatus } from "@/features/auth/types";
import { getApiErrorMessage } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

type StatusFilter = "ALL" | UserStatus;

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <UsersContent />
      </AdminLayout>
    </RoleGuard>
  );
}

function UsersContent() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      if (!accessToken) {
        return;
      }

      try {
        setIsLoading(true);
        setUsers(await getUsersApi(accessToken));
      } catch (error) {
        toast.error("Unable to load users", {
          description: getApiErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadUsers();
  }, [accessToken]);

  const statusCounts = useMemo(() => {
    return users.reduce(
      (counts, user) => {
        counts[user.status] += 1;
        return counts;
      },
      { ACTIVE: 0, PENDING: 0, REJECTED: 0, SUSPENDED: 0 } as Record<
        UserStatus,
        number
      >,
    );
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesStatus =
        statusFilter === "ALL" || user.status === statusFilter;

      return (
        matchesStatus &&
        matchesSearch(searchQuery, [user.fullName, user.email, user.phone])
      );
    });
  }, [searchQuery, statusFilter, users]);

  const filterOptions: Array<{ value: StatusFilter; label: string; count?: number }> =
    [
      { value: "ALL", label: "All", count: users.length },
      { value: "ACTIVE", label: "Active", count: statusCounts.ACTIVE },
      { value: "PENDING", label: "Pending", count: statusCounts.PENDING },
      { value: "REJECTED", label: "Rejected", count: statusCounts.REJECTED },
      { value: "SUSPENDED", label: "Suspended", count: statusCounts.SUSPENDED },
    ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Users"
        description="Customer accounts registered on BookMyVenue."
        count={filteredUsers.length}
        countLabel="shown"
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
          placeholder="Search by name, email, or phone..."
        />
      </div>

      <AdminSection title="User directory">
        {isLoading ? (
          <AdminTableSkeleton rows={5} />
        ) : filteredUsers.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title={users.length === 0 ? "No users yet" : "No matches found"}
            description={
              users.length === 0
                ? "User accounts will appear here after registration."
                : "Try changing filters or your search term."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-6 pb-3 pt-2 font-medium">User</th>
                  <th className="px-6 pb-3 pt-2 font-medium">Phone</th>
                  <th className="px-6 pb-3 pt-2 font-medium">Status</th>
                  <th className="px-6 pb-3 pt-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20"
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-zinc-900 dark:text-white">
                        {user.fullName}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">{user.email}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {user.phone || "—"}
                    </td>
                    <td className="px-6 py-4">
                      <UserStatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
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
