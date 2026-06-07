"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { logout } from "@/features/auth/auth-slice";
import { ROUTES } from "@/lib/routes";
import { useAppDispatch } from "@/store/hooks";

export function LogoutButton() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  function handleLogout() {
    dispatch(logout());
    router.push(ROUTES.auth.login);
  }

  return (
    <Button variant="outline" type="button" onClick={handleLogout}>
      Logout
    </Button>
  );
}
