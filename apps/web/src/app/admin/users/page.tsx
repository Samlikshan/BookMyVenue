"use client";

import { CalendarDays, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { getUsersApi } from "@/features/admin/admin-api";
import type { AuthUser, UserStatus } from "@/features/auth/types";
import { useAppSelector } from "@/store/hooks";

const statusStyles: Record<UserStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
  SUSPENDED: "bg-zinc-100 text-zinc-700 ring-zinc-600/20",
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

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
          description: getErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadUsers();
  }, [accessToken]);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Users Directory
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          View all normal user accounts registered on BookMyVenue.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            Platform Members
          </h3>
          <p className="text-xs text-zinc-500">
            Normal user account directory.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4 p-6">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
              <Users className="size-7" />
            </div>
            <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
              No users found
            </h4>
            <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
              User accounts will appear here after registration.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="pb-3 font-semibold">User</th>
                  <th className="pb-3 font-semibold">Phone</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10"
                  >
                    <td className="py-4">
                      <div className="font-bold text-zinc-900 dark:text-white">
                        {user.fullName}
                      </div>
                      <div className="mt-1 text-2xs text-zinc-500">
                        {user.email}
                      </div>
                    </td>
                    <td className="py-4 text-zinc-500">{user.phone}</td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[user.status]}`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 text-zinc-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
