"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { getCurrentUserApi } from "@/features/auth/auth-api";
import { logout, setCurrentUser } from "@/features/auth/auth-slice";
import { setupApiAuthInterceptor } from "@/lib/setup-api-auth";
import { ROUTES } from "@/lib/routes";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function AuthSessionSync() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
  const hasValidated = useRef(false);

  useEffect(() => {
    setupApiAuthInterceptor();
  }, []);

  useEffect(() => {
    if (hasValidated.current || !isAuthenticated || !accessToken) {
      return;
    }

    hasValidated.current = true;

    async function validateSession() {
      try {
        const user = await getCurrentUserApi(accessToken!);
        dispatch(setCurrentUser(user));
      } catch {
        dispatch(logout());
        router.replace(ROUTES.auth.login);
      }
    }

    void validateSession();
  }, [accessToken, dispatch, isAuthenticated, router]);

  return null;
}
