import axios, { type AxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ??
  "http://localhost:5000/api";

type ApiRequestOptions = AxiosRequestConfig & {
  accessToken?: string | null;
  body?: unknown;
};

export type ApiResponse<T> = {
  success: boolean;
  statusCode?: number;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export async function apiRequest<T>(
  path: string,
  { accessToken, body, headers, ...options }: ApiRequestOptions = {},
) {
  const response = await axios({
    baseURL: API_BASE_URL,
    url: path,
    data: body,
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    ...options,
  });

  return response.data as ApiResponse<T>;
}
