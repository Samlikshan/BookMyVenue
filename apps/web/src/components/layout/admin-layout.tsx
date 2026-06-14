"use client";

import {
  Building2,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldAlert,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { logout } from "@/features/auth/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: ROUTES.admin.dashboard,
      icon: LayoutDashboard,
    },
    {
      name: "Owners Approval",
      href: ROUTES.admin.pendingOwners,
      icon: Users,
    },
    {
      name: "Venues Approval",
      href: ROUTES.admin.venues,
      icon: Building2,
    },
  ];

  function handleLogout() {
    dispatch(logout());
    toast.success("Logged out successfully");
    router.push(ROUTES.auth.login);
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:block">
        <div className="flex h-full flex-col justify-between p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                <ShieldAlert className="size-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  BookMyVenue
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Admin Control Panel
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="size-4.5" />
                      {item.name}
                    </div>
                    <ChevronRight className={`size-3.5 opacity-0 transition-transform duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 ${isActive ? "opacity-100" : ""}`} />
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4">
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <div className="flex items-center gap-3 px-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <User className="size-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                    {user?.fullName}
                  </p>
                  <p className="truncate text-2xs text-zinc-500 dark:text-zinc-400">
                    Platform Administrator
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-3 border-zinc-200 text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
            >
              <Menu className="size-6" />
            </button>
            <div className="hidden md:block">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                System Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-2.5 py-0.5 text-xs font-semibold">
              Root Admin
            </span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white p-6 shadow-xl transition-transform duration-300 dark:bg-zinc-900 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                  <ShieldAlert className="size-4.5" />
                </div>
                <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  BookMyVenue
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <X className="size-5" />
              </button>
            </div>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    }`}
                  >
                    <Icon className="size-4.5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="space-y-4">
            <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <div className="flex items-center gap-3 px-2">
                <div className="flex size-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <User className="size-5" />
                </div>
                <div className="overflow-hidden">
                  <p className="truncate text-xs font-semibold text-zinc-900 dark:text-zinc-50">
                    {user?.fullName}
                  </p>
                  <p className="truncate text-2xs text-zinc-500 dark:text-zinc-400">
                    Platform Administrator
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full justify-start gap-3 border-zinc-200 text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <LogOut className="size-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
