import { RoleGuard } from "@/components/auth/role-guard";
import { LogoutButton } from "@/features/auth/logout-button";

export default function OwnerDashboardPage() {
  return (
    <RoleGuard allowedRoles={["OWNER"]}>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">Owner Dashboard</h1>
        <LogoutButton />
      </main>
    </RoleGuard>
  );
}
