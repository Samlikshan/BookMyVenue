"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { RoleGuard } from "@/components/auth/role-guard";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/features/auth/types";
import {
  approveOwnerApi,
  getPendingOwnersApi,
  rejectOwnerApi,
} from "@/features/admin/owners-api";
import { useAppSelector } from "@/store/hooks";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

export default function PendingOwnersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminShell>
        <PendingOwnersContent />
      </AdminShell>
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
        setOwners(await getPendingOwnersApi(accessToken));
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

  async function handleApprove(ownerId: string) {
    if (!accessToken) {
      return;
    }

    try {
      setActionOwnerId(ownerId);
      await approveOwnerApi(ownerId, accessToken);
      setOwners((currentOwners) =>
        currentOwners.filter((owner) => owner.id !== ownerId),
      );
      toast.success("Owner approved", {
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
      toast.success("Owner rejected", {
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
    <main className="p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-xl border bg-background p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Admin Review
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Pending Owners
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review venue owner registrations before they can manage venues.
            </p>
          </div>
        </header>

        <section className="overflow-hidden rounded-xl border bg-background shadow-sm">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Loading pending owner applications...
            </div>
          ) : owners.length === 0 ? (
            <div className="p-8 text-center">
              <h2 className="text-lg font-semibold">No pending owners</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Fresh inbox. The approval goblin has nothing to chew on.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Owner</th>
                    <th className="px-4 py-3 font-medium">Business</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
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
                      <td className="px-4 py-4 text-muted-foreground">
                        {owner.ownerApplication?.createdAt
                          ? new Date(
                              owner.ownerApplication.createdAt,
                            ).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={actionOwnerId === owner.id}
                            onClick={() => void handleApprove(owner.id)}
                          >
                            <Check className="size-4" />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={actionOwnerId === owner.id}
                            onClick={() => setRejectingOwner(owner)}
                          >
                            <X className="size-4" />
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
        </section>
      </div>

      {rejectingOwner ? (
        <RejectOwnerModal
          ownerName={rejectingOwnerName}
          isSubmitting={actionOwnerId === rejectingOwner.id}
          onClose={() => setRejectingOwner(null)}
          onSubmit={handleReject}
        />
      ) : null}
    </main>
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
        className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl"
        onSubmit={handleSubmit}
      >
        <h2 className="text-lg font-semibold">Reject {ownerName}?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Add a clear reason. The owner will see this message after they log in.
        </p>
        <textarea
          className="mt-4 min-h-32 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
