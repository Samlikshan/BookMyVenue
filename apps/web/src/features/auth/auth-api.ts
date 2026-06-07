import { apiRequest } from "@/lib/api";
import type {
  AuthSession,
  AuthUser,
  LoginInput,
  RegisterOwnerInput,
  RegisterUserInput,
} from "./types";

export async function loginApi(credentials: LoginInput) {
  const response = await apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: credentials,
  });

  if (!response.data) {
    throw new Error("Login response is missing session data");
  }

  return response.data;
}

export async function registerUserApi(input: RegisterUserInput) {
  const response = await apiRequest<{ profile: AuthUser }>(
    "/auth/register-user",
    {
      method: "POST",
      body: input,
    },
  );

  if (!response.data?.profile) {
    throw new Error("Registration response is missing profile data");
  }

  return response.data.profile;
}

export async function registerOwnerApi(input: RegisterOwnerInput) {
  const response = await apiRequest<{ profile: AuthUser }>(
    "/auth/register-owner",
    {
      method: "POST",
      body: input,
    },
  );

  if (!response.data?.profile) {
    throw new Error("Owner registration response is missing profile data");
  }

  return response.data.profile;
}

export async function getCurrentUserApi(accessToken: string) {
  const response = await apiRequest<{ user: AuthUser }>("/auth/me", {
    accessToken,
  });

  if (!response.data?.user) {
    throw new Error("Current user response is missing user data");
  }

  return response.data.user;
}
