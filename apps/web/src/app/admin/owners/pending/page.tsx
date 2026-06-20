"use client";

import { Check, Mail, Phone, Users, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
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

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [actionOwnerId, setActionOwnerId] = useState<string | null>(null);
  const [rejectingOwner, setRejectingOwner] = useState<AuthUser | null>(null);

  const rejectingOwnerName = useMemo(
    () => rejectingOwner?.fullName ?? "this owner",
    [rejectingOwner],
  );

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
          description: getErrorMessage(error),
        });
      } finally {
        setIsLoading(false);
      }
    }

    void loadPendingOwners();
  }, [accessToken]);

  async function handleApprove(ownerId: string, ownerName: string) {
    if (!accessToken) {
      return;
    }

    try {
      setActionOwnerId(ownerId);
      await approveOwnerApi(ownerId, accessToken);
      setOwners((currentOwners) =>
        currentOwners.filter((owner) => owner.id !== ownerId),
      );
      toast.success(`Approved owner: ${ownerName}`, {
        description: "They can now access the owner dashboard.",
      });
    } catch (error) {
      toast.error("Approval failed", {
        description: getErrorMessage(error),
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
      setOwners((currentOwners) =>
        currentOwners.filter((owner) => owner.id !== rejectingOwner.id),
      );
      setRejectingOwner(null);
      toast.success(`Rejected registration: ${rejectingOwner.fullName}`, {
        description: "The rejection reason will be shown after login.",
      });
    } catch (error) {
      toast.error("Rejection failed", {
        description: getErrorMessage(error),
      });
    } finally {
      setActionOwnerId(null);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-950 dark:text-white">
          Owners Verification Queue
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Audit and verify venue managers registering business portals on the
          platform.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="border-b border-zinc-100 px-6 py-5 dark:border-zinc-800">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
            Pending Registrations
          </h3>
          <p className="text-xs text-zinc-500">
            Review credentials before granting access.
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-16 w-full animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800"
                />
              ))}
            </div>
          ) : owners.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                <Users className="size-7" />
              </div>
              <h4 className="text-lg font-bold text-zinc-900 dark:text-white">
                Clean Queue
              </h4>
              <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
                No venue owner registrations are awaiting verification at this
                time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                    <th className="pb-3 font-semibold">Owner Details</th>
                    <th className="pb-3 font-semibold">Business Registry</th>
                    <th className="pb-3 font-semibold">Base City</th>
                    <th className="pb-3 text-right font-semibold">
                      Verification Audit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {owners.map((owner) => (
                    <tr
                      key={owner.id}
                      className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10"
                    >
                      <td className="py-4">
                        <p className="font-bold text-zinc-900 dark:text-white">
                          {owner.fullName}
                        </p>
                        <div className="mt-1 flex flex-col gap-1 text-2xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" />
                            {owner.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" />
                            {owner.phone}
                          </span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                          {owner.ownerApplication?.businessName ?? "-"}
                        </span>
                      </td>
                      <td className="py-4 text-zinc-600 dark:text-zinc-400">
                        {owner.ownerApplication?.city ?? "-"}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            disabled={actionOwnerId === owner.id}
                            onClick={() =>
                              void handleApprove(owner.id, owner.fullName)
                            }
                            className="h-8 gap-1.5 bg-emerald-600 px-3 text-2xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                          >
                            <Check className="size-3.5" />
                            Verify
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={actionOwnerId === owner.id}
                            onClick={() => setRejectingOwner(owner)}
                            className="h-8 gap-1.5 border-zinc-200 px-3 text-2xs text-rose-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-zinc-800 dark:hover:bg-rose-950/20"
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
      </section>

      {rejectingOwner ? (
        <RejectOwnerModal
          ownerName={rejectingOwnerName}
          isSubmitting={actionOwnerId === rejectingOwner.id}
          onClose={() => setRejectingOwner(null)}
          onSubmit={handleReject}
        />
      ) : null}
    </div>
  );
}

type RejectOwnerModalProps = {
  ownerName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (rejectionReason: string) => Promise<void>;
};

function RejectOwnerModal({
  ownerName,
  isSubmitting,
  onClose,
  onSubmit,
}: RejectOwnerModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      toast.error("Reason required", {
        description: "Please explain why this owner is being rejected.",
      });
      return;
    }

    await onSubmit(trimmedReason);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
          Reject {ownerName}?
        </h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Add a clear reason. The owner will see this message after they log in.
        </p>
        <textarea
          className="mt-4 min-h-32 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:border-zinc-800 dark:bg-zinc-950"
          placeholder="Example: Business details could not be verified."
          value={rejectionReason}
          onChange={(event) => setRejectionReason(event.target.value)}
          disabled={isSubmitting}
          required
        />
        <div className="mt-5 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Rejecting..." : "Reject Owner"}
          </Button>
        </div>
      </form>
    </div>
  );
}
