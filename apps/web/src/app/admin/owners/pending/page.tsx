"use client";

import { AlertCircle, Check, Mail, Phone, Users, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { RoleGuard } from "@/components/auth/role-guard";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import {
  approveOwnerApi,
  listPendingOwnersApi,
  rejectOwnerApi,
} from "@/features/admin/admin-api";
import type { AuthUser } from "@/features/auth/types";
import { useAppSelector } from "@/store/hooks";

export default function AdminPendingOwnersPage() {
  const { accessToken } = useAppSelector((state) => state.auth);
  const [owners, setOwners] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadPendingOwners() {
    if (!accessToken) return;
    try {
      const data = await listPendingOwnersApi(accessToken);
      setOwners(data);
    } catch (error) {
      console.error("Failed to fetch pending owners", error);
      toast.error("Failed to load queue");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPendingOwners();
  }, [accessToken]);

  async function handleApprove(ownerId: string, name: string) {
    if (!accessToken) return;
    const confirmed = window.confirm(`Approve registration for ${name}?`);
    if (!confirmed) return;

    try {
      const result = await approveOwnerApi(ownerId, accessToken);
      if (result) {
        toast.success(`Approved owner: ${name}`);
        setOwners((prev) => prev.filter((o) => o.id !== ownerId));
      }
    } catch (error) {
      toast.error("Failed to approve owner registration");
    }
  }

  async function handleReject(ownerId: string, name: string) {
    if (!accessToken) return;
    const reason = window.prompt(`Enter rejection reason for ${name}:`);
    if (reason === null) return; // cancelled
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error("Rejection reason is required");
      return;
    }

    try {
      const result = await rejectOwnerApi(ownerId, trimmed, accessToken);
      if (result) {
        toast.success(`Rejected registration: ${name}`);
        setOwners((prev) => prev.filter((o) => o.id !== ownerId));
      }
    } catch (error) {
      toast.error("Failed to reject owner registration");
    }
  }

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminLayout>
        <div className="space-y-8 animate-fade-in-up">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
              Owners Verification Queue
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Audit and verify venue managers registering business portals on the platform.
            </p>
          </div>

          {/* Owners Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50 overflow-hidden">
            <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Pending Registrations</h3>
              <p className="text-xs text-zinc-500">Review credentials before granting access.</p>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                  ))}
                </div>
              ) : owners.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-450 mb-4">
                    <Users className="size-7" />
                  </div>
                  <h4 className="text-lg font-bold text-zinc-900 dark:text-white">Clean Queue</h4>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
                    No venue owner registrations are awaiting verification at this time.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-zinc-100 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                        <th className="pb-3 font-semibold">Owner Details</th>
                        <th className="pb-3 font-semibold">Business Registry</th>
                        <th className="pb-3 font-semibold">Base City</th>
                        <th className="pb-3 text-right font-semibold">Verification Audit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                      {owners.map((owner) => (
                        <tr key={owner.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                          <td className="py-4">
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-white">{owner.fullName}</p>
                              <div className="flex flex-col gap-1 mt-1 text-2xs text-zinc-500">
                                <span className="flex items-center gap-1">
                                  <Mail className="size-3" />
                                  {owner.email}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="size-3" />
                                  {owner.phone}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                              {owner.ownerApplication?.businessName}
                            </span>
                          </td>
                          <td className="py-4 text-zinc-600 dark:text-zinc-400">
                            {owner.ownerApplication?.city}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                onClick={() => handleApprove(owner.id, owner.fullName)}
                                className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-2xs px-3 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                              >
                                <Check className="size-3.5" />
                                Verify
                              </Button>
                              <Button
                                onClick={() => handleReject(owner.id, owner.fullName)}
                                variant="outline"
                                className="h-8 gap-1.5 border-zinc-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-2xs px-3 dark:border-zinc-800 dark:hover:bg-rose-950/20"
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
            </div>
          </div>
        </div>
      </AdminLayout>
    </RoleGuard>
  );
}
