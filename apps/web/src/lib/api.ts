import axios, {
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";

import type { AuthSession } from "@/features/auth/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:5000/api";

type ApiAuthHandlers = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  onSessionRefreshed: (session: AuthSession) => void;
  onAuthFailure: () => void;
};

type CustomAxiosConfig = InternalAxiosRequestConfig & {
  skipAuthRefresh?: boolean;
  _retry?: boolean;
};

type ApiRequestOptions = AxiosRequestConfig & {
  accessToken?: string | null;
  body?: unknown;
  skipAuthRefresh?: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  statusCode?: number;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

let authHandlers: ApiAuthHandlers | null = null;
let refreshPromise: Promise<AuthSession | null> | null = null;

export function configureApiAuth(handlers: ApiAuthHandlers) {
  authHandlers = handlers;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosConfig | undefined;

    if (
      !originalRequest ||
      originalRequest.skipAuthRefresh ||
      originalRequest._retry ||
      error.response?.status !== 401 ||
      !authHandlers
    ) {
      return Promise.reject(error);
    }

    const refreshToken = authHandlers.getRefreshToken();
    if (!refreshToken) {
      authHandlers.onAuthFailure();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const response = await apiClient.request<ApiResponse<AuthSession>>({
            url: "/auth/refresh",
            method: "POST",
            data: { refreshToken },
            skipAuthRefresh: true,
          } as CustomAxiosConfig);

          const session = response.data.data;
          if (!session) {
            authHandlers!.onAuthFailure();
            return null;
          }

          authHandlers!.onSessionRefreshed(session);
          return session;
        } catch {
          authHandlers!.onAuthFailure();
          return null;
        } finally {
          refreshPromise = null;
        }
      })();
    }

    const session = await refreshPromise;
    if (!session) {
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `Bearer ${session.accessToken}`;
    return apiClient(originalRequest);
  },
);

function resolveAccessToken(explicitToken?: string | null) {
  return explicitToken ?? authHandlers?.getAccessToken() ?? null;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    return typeof message === "string" ? message : error.message;
  }

  return error instanceof Error ? error.message : "Something went wrong";
}

export async function apiRequest<T>(
  path: string,
  {
    accessToken,
    body,
    headers,
    skipAuthRefresh,
    ...options
  }: ApiRequestOptions = {},
) {
  const token = resolveAccessToken(accessToken);

  const response = await apiClient({
    url: path,
    data: body,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    skipAuthRefresh,
    ...options,
  } as CustomAxiosConfig);

  return response.data as ApiResponse<T>;
}
