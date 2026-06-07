import { RoleGuard } from "@/components/auth/role-guard";
import { LogoutButton } from "@/features/auth/logout-button";

export default function PendingOwnersPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">Pending Owners</h1>
        <LogoutButton />
      </main>
    </RoleGuard>
  );
}
