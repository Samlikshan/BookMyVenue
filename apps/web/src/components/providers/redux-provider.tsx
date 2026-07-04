"use client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { AuthSessionSync } from "@/components/auth/auth-session-sync";
import { persistor, store } from "@/store";

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <AuthSessionSync />
        {children}
      </PersistGate>
    </Provider>
  );
}
