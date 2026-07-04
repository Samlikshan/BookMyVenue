"use client";

import { Check, Mail, Phone, Users, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  AdminSearchInput,
  matchesSearch,
} from "@/components/admin/admin-filters";
import { AdminRejectModal } from "@/components/admin/admin-stat-card";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminSection,
  AdminTableSkeleton,
} from "@/components/admin/admin-ui";
import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  approveOwnerApi,
  listPendingOwnersApi,
  rejectOwnerApi,
} from "@/features/admin/admin-api";
import type { AuthUser } from "@/features/auth/types";
import { getApiErrorMessage } from "@/lib/api";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";

export default function AdminPendingOwnersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <PendingOwnersContent />
      </AdminLayout>
    </RoleGuard>
  );
}

function PendingOwnersContent() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [owners, setOwners] = useState<AuthUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionOwnerId, setActionOwnerId] = useState<string | null>(null);
  const [rejectingOwner, setRejectingOwner] = useState<AuthUser | null>(null);

  useEffect(() => {
    async function loadPendingOwners() {
      if (!accessToken) {
        return;
      }

      try {
        setIsLoading(true);
        setOwners(await listPendingOwnersApi(accessToken));
      } catch (error) {
        toast.error("Unable to load pending owners", {
          description: getApiErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadPendingOwners();
  }, [accessToken]);

  const filteredOwners = useMemo(
    () =>
      owners.filter((owner) =>
        matchesSearch(searchQuery, [
          owner.fullName,
          owner.email,
          owner.phone,
          owner.ownerApplication?.businessName,
          owner.ownerApplication?.city,
        ]),
      ),
    [owners, searchQuery],
  );

  async function handleApprove(ownerId: string, ownerName: string) {
    if (!accessToken) {
      return;
    }

    try {
      setActionOwnerId(ownerId);
      await approveOwnerApi(ownerId, accessToken);
      setOwners((current) => current.filter((owner) => owner.id !== ownerId));
      toast.success(`Approved ${ownerName}`, {
        description: "They can now access the owner dashboard.",
      });
    } catch (error) {
      toast.error("Approval failed", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setActionOwnerId(null);
    }
  }

  async function handleReject(rejectionReason: string) {
    if (!accessToken || !rejectingOwner) {
      return;
    }

    try {
      setActionOwnerId(rejectingOwner.id);
      await rejectOwnerApi(rejectingOwner.id, rejectionReason, accessToken);
      setOwners((current) =>
        current.filter((owner) => owner.id !== rejectingOwner.id),
      );
      setRejectingOwner(null);
      toast.success(`Rejected ${rejectingOwner.fullName}`, {
        description: "The owner will see your reason when they log in.",
      });
    } catch (error) {
      toast.error("Rejection failed", {
        description: getApiErrorMessage(error),
      });
    } finally {
      setActionOwnerId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Owner approvals"
        description="Review venue manager registrations before granting dashboard access."
        count={owners.length}
        countLabel="pending"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.admin.owners}>All owners</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <AdminSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, or business..."
        />
      </div>

      <AdminSection
        title="Pending registrations"
        description="Approve or reject each application with a clear audit trail."
      >
        {isLoading ? (
          <AdminTableSkeleton rows={4} />
        ) : filteredOwners.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title={owners.length === 0 ? "Queue is empty" : "No matches found"}
            description={
              owners.length === 0
                ? "No owner registrations are waiting for review."
                : "Try a different search term."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="px-6 pb-3 pt-2 font-medium">Owner</th>
                  <th className="px-6 pb-3 pt-2 font-medium">Business</th>
                  <th className="px-6 pb-3 pt-2 font-medium">City</th>
                  <th className="px-6 pb-3 pt-2 text-right font-medium">
                    Actions
                  </th>
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
                      <div className="mt-1 space-y-0.5 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5">
                          <Mail className="size-3" />
                          {owner.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="size-3" />
                          {owner.phone || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-200">
                      {owner.ownerApplication?.businessName ?? "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {owner.ownerApplication?.city ?? "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={actionOwnerId === owner.id}
                          onClick={() =>
                            void handleApprove(owner.id, owner.fullName)
                          }
                          className="gap-1.5"
                        >
                          <Check className="size-3.5" />
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={actionOwnerId === owner.id}
                          onClick={() => setRejectingOwner(owner)}
                          className="gap-1.5 text-red-600 hover:text-red-700"
                        >
                          <X className="size-3.5" />
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      {rejectingOwner ? (
        <AdminRejectModal
          title={`Reject ${rejectingOwner.fullName}?`}
          description="The owner will see this reason after they log in."
          submitLabel="Reject owner"
          isSubmitting={actionOwnerId === rejectingOwner.id}
          onClose={() => setRejectingOwner(null)}
          onSubmit={handleReject}
        />
      ) : null}
    </div>
  );
}
