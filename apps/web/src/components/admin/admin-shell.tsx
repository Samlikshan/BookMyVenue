"use client";

import { Building2, Clock3, LayoutDashboard, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LogoutButton } from "@/features/auth/logout-button";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const adminLinks = [
  {
    href: ROUTES.admin.dashboard,
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: ROUTES.admin.owners,
    label: "Owners",
    icon: Building2,
  },
  {
    href: ROUTES.admin.pendingOwners,
    label: "Pending Owners",
    icon: Clock3,
  },
  {
    href: ROUTES.admin.users,
    label: "Users",
    icon: Users,
  },
];

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-muted/30 md:grid md:grid-cols-[260px_1fr]">
      <aside className="border-b bg-background md:min-h-screen md:border-r md:border-b-0">
        <div className="flex h-full flex-col">
          <div className="border-b p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Book My Venue
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              Admin
            </h2>
          </div>

          <nav className="flex gap-2 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-visible">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== ROUTES.admin.dashboard &&
                  pathname.startsWith(`${link.href}/`));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                    isActive && "bg-muted text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  <span className="whitespace-nowrap">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="hidden border-t p-4 md:block">
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="flex items-center justify-between border-b bg-background px-6 py-4 md:hidden">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Admin
            </p>
            <h1 className="text-lg font-semibold">Management</h1>
          </div>
          <LogoutButton />
        </header>
        {children}
      </div>
    </div>
  );
}
