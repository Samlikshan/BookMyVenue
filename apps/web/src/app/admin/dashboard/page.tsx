import { AdminShell } from "@/components/admin/admin-shell";
import { RoleGuard } from "@/components/auth/role-guard";

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <AdminShell>
        <main className="p-6">
          <section className="rounded-xl border bg-background p-6 shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">Admin</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the sidebar to review owners, pending applications, and users.
            </p>
          </section>
        </main>
      </AdminShell>
    </RoleGuard>
  );
}
