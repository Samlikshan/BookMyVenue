import type { UserRole } from "@/features/auth/types";
import { ROUTES } from "@/lib/routes";

export function getDashboardRoute(role: UserRole) {
  if (role === "ADMIN") {
    return ROUTES.admin.dashboard;
  }

  if (role === "OWNER") {
    return ROUTES.owner.dashboard;
  }

  return ROUTES.user.dashboard;
}
