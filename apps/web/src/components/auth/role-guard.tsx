"use client";

import { AlertCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { UserRole, UserStatus } from "@/features/auth/types";
import { LogoutButton } from "@/features/auth/logout-button";
import { getDashboardRoute } from "@/lib/auth-routes";
import { ROUTES } from "@/lib/routes";
import { useAppSelector } from "@/store/hooks";

type RoleGuardProps = {
  allowedRoles: UserRole[];
  allowedStatuses?: UserStatus[];
  children: React.ReactNode;
};

export function RoleGuard({
  allowedRoles,
  allowedStatuses,
  children,
}: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const isAllowedRole = user ? allowedRoles.includes(user.role) : false;
  const isAllowedStatus =
    !allowedStatuses || (user ? allowedStatuses.includes(user.status) : false);
  const isOwnerApprovalBlocked =
    user?.role === "OWNER" && isAllowedRole && user.status !== "ACTIVE";

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(ROUTES.auth.login);
      return;
    }

    if (isOwnerApprovalBlocked) {
      return;
    }

    if (user && (!isAllowedRole || !isAllowedStatus)) {
      router.replace(getDashboardRoute(user.role));
    }
  }, [
    isAllowedRole,
    isAllowedStatus,
    isAuthenticated,
    isOwnerApprovalBlocked,
    router,
    user,
  ]);

  if (!isAuthenticated || !user || !isAllowedRole) {
    return null;
  }

  if (isOwnerApprovalBlocked) {
    return <OwnerApprovalStatus status={user.status} reason={user.ownerApplication?.rejectionReason} />;
  }

  if (!isAllowedStatus) {
    return null;
  }

  return <>{children}</>;
}

type OwnerApprovalStatusProps = {
  status: UserStatus;
  reason?: string | null;
};

function OwnerApprovalStatus({ status, reason }: OwnerApprovalStatusProps) {
  const isRejected = status === "REJECTED";
  const Icon = isRejected ? AlertCircle : Clock;

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <section className="w-full max-w-lg rounded-xl border bg-background p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">
          {isRejected ? "Account request rejected" : "Account under review"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {isRejected
            ? "Your venue owner account was reviewed and rejected by admin."
            : "Your venue owner account is not approved yet. Please wait and check again after some time."}
        </p>
        {isRejected && reason ? (
          <div className="mt-5 rounded-lg border bg-muted/40 p-4 text-left">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Reason
            </p>
            <p className="mt-2 text-sm">{reason}</p>
          </div>
        ) : null}
        <div className="mt-6 flex justify-center">
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}
