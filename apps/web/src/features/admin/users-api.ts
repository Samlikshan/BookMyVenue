import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/features/auth/types";

export async function getUsersApi(accessToken: string) {
  const response = await apiRequest<{ users: AuthUser[] }>("/admin/users", {
    accessToken,
  });

  return response.data?.users ?? [];
}
