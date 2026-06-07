"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { UserRole, UserStatus } from "@/features/auth/types";
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

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace(ROUTES.auth.login);
      return;
    }

    if (user && (!isAllowedRole || !isAllowedStatus)) {
      router.replace(getDashboardRoute(user.role));
    }
  }, [isAllowedRole, isAllowedStatus, isAuthenticated, router, user]);

  if (!isAuthenticated || !user || !isAllowedRole || !isAllowedStatus) {
    return null;
  }

  return <>{children}</>;
}
