import { RoleGuard } from "@/components/auth/role-guard";
import { LogoutButton } from "@/features/auth/logout-button";

export default function BookingsPage() {
  return (
    <RoleGuard allowedRoles={["USER"]}>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">User Bookings</h1>
        <LogoutButton />
      </main>
    </RoleGuard>
  );
}
