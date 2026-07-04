"use client";

import { setCredentials, logout } from "@/features/auth/auth-slice";
import { configureApiAuth } from "@/lib/api";
import { store } from "@/store";

let configured = false;

export function setupApiAuthInterceptor() {
  if (configured) {
    return;
  }

  configured = true;

  configureApiAuth({
    getAccessToken: () => store.getState().auth.accessToken,
    getRefreshToken: () => store.getState().auth.refreshToken,
    onSessionRefreshed: (session) => {
      store.dispatch(setCredentials(session));
    },
    onAuthFailure: () => {
      store.dispatch(logout());
    },
  });
}
