"use client";

import {
  Building2,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { logout } from "@/features/auth/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

type AdminLayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  {
    name: "Dashboard",
    href: ROUTES.admin.dashboard,
    icon: LayoutDashboard,
  },
  {
    name: "Owner Approvals",
    href: ROUTES.admin.pendingOwners,
    icon: UserCheck,
  },
  {
    name: "Owners",
    href: ROUTES.admin.owners,
    icon: Building2,
  },
  {
    name: "Venues",
    href: ROUTES.admin.venues,
    icon: ClipboardCheck,
  },
  {
    name: "Users",
    href: ROUTES.admin.users,
    icon: Users,
  },
];

const pageTitles: Record<string, string> = {
  [ROUTES.admin.dashboard]: "Dashboard",
  [ROUTES.admin.pendingOwners]: "Owner Approvals",
  [ROUTES.admin.owners]: "Owners",
  [ROUTES.admin.venues]: "Venues",
  [ROUTES.admin.users]: "Users",
};

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== ROUTES.admin.dashboard &&
            pathname.startsWith(`${item.href}/`));
        const Icon = item.icon;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            }`}
          >
            <span className="flex items-center gap-3">
              <Icon className="size-4" />
              {item.name}
            </span>
            <ChevronRight
              className={`size-3.5 transition-opacity ${
                isActive ? "opacity-100" : "opacity-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pageTitle = useMemo(() => {
    if (pageTitles[pathname]) {
      return pageTitles[pathname];
    }

    const match = navItems.find(
      (item) =>
        item.href !== ROUTES.admin.dashboard &&
        pathname.startsWith(item.href),
    );

    return match?.name ?? "Admin";
  }, [pathname]);

  function handleLogout() {
    dispatch(logout());
    toast.success("Logged out successfully");
    router.push(ROUTES.auth.login);
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:block">
        <div className="flex h-full flex-col justify-between p-5">
          <div className="space-y-6">
            <Link href={ROUTES.admin.dashboard} className="flex items-center gap-3 px-1">
              <div className="flex size-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <Shield className="size-4.5" />
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  BookMyVenue
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Admin panel
                </p>
              </div>
            </Link>

            <SidebarNav pathname={pathname} />
          </div>

          <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="flex items-center gap-3 px-1">
              <span className="flex size-9 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {user ? getInitials(user.fullName) : "A"}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {user?.fullName}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  Administrator
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-2"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col md:pl-64">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {pageTitle}
              </p>
              <Link
                href={ROUTES.home}
                className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
              >
                Back to site
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>

      {isMobileMenuOpen ? (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
        />
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-zinc-200 bg-white p-5 shadow-xl transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-900 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                Admin menu
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="size-5" />
              </button>
            </div>
            <SidebarNav
              pathname={pathname}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start gap-2"
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
