"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/admin-shell";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import { getOwnersApi } from "@/features/admin/owners-api";
import type { AuthUser, UserStatus } from "@/features/auth/types";
import { ROUTES } from "@/lib/routes";
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

export default function OwnersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminShell>
        <OwnersContent />
      </AdminShell>
    </RoleGuard>
  );
}

function OwnersContent() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [owners, setOwners] = useState<AuthUser[]>([]);
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
          description: getErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadOwners();
  }, [accessToken]);

  return (
    <main className="p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-xl border bg-background p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Admin
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Owners
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              View every venue owner account and its current approval status.
            </p>
          </div>
          <Button asChild>
            <Link href={ROUTES.admin.pendingOwners}>Pending Reviews</Link>
          </Button>
        </header>

        <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading owners...
            </div>
          ) : owners.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="text-lg font-semibold">No owners found</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Owner accounts will appear here after registration.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Business</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Reviewed</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((owner) => (
                    <tr key={owner.id} className="border-b last:border-0">
                      <td className="px-4 py-4">
                        <div className="font-medium">{owner.fullName}</div>
                        <div className="text-muted-foreground">
                          {owner.email}
                        </div>
                        <div className="text-muted-foreground">
                          {owner.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {owner.ownerApplication?.businessName ?? "-"}
                      </td>
                      <td className="px-4 py-4">
                        {owner.ownerApplication?.city ?? "-"}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[owner.status]}`}
                        >
                          {owner.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {owner.ownerApplication?.reviewedAt
                          ? new Date(
                              owner.ownerApplication.reviewedAt,
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {owner.ownerApplication?.createdAt
                          ? new Date(
                              owner.ownerApplication.createdAt,
                            ).toLocaleDateString()
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
