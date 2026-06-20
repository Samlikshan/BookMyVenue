"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { RoleGuard } from "@/components/auth/role-guard";
import { getUsersApi } from "@/features/admin/users-api";
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
      <AdminShell>
        <UsersContent />
      </AdminShell>
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
    <main className="p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-xl border bg-background p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Users</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            View all normal user accounts registered on Book My Venue.
          </p>
        </header>

        <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="text-lg font-semibold">No users found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                User accounts will appear here after registration.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="px-4 py-4">
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-muted-foreground">
                          {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {user.phone}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[user.status]}`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
