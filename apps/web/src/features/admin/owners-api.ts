import { apiRequest } from "@/lib/api";
import type { AuthUser } from "@/features/auth/types";

export async function getOwnersApi(accessToken: string) {
  const response = await apiRequest<{ owners: AuthUser[] }>("/admin/owners", {
    accessToken,
  });

  return response.data?.owners ?? [];
}

export async function getPendingOwnersApi(accessToken: string) {
  const response = await apiRequest<{ owners: AuthUser[] }>(
    "/admin/owners/pending",
    {
      accessToken,
    },
  );

  return response.data?.owners ?? [];
}

export async function approveOwnerApi(ownerId: string, accessToken: string) {
  const response = await apiRequest<{ owner: AuthUser }>(
    `/admin/owners/${ownerId}/approve`,
    {
      method: "PATCH",
      accessToken,
    },
  );

  if (!response.data?.owner) {
    throw new Error("Approve owner response is missing owner data");
  }

  return response.data.owner;
}

export async function rejectOwnerApi(
  ownerId: string,
  rejectionReason: string,
  accessToken: string,
) {
  const response = await apiRequest<{ owner: AuthUser }>(
    `/admin/owners/${ownerId}/reject`,
    {
      method: "PATCH",
      accessToken,
      body: {
        rejectionReason,
      },
    },
  );

  if (!response.data?.owner) {
    throw new Error("Reject owner response is missing owner data");
  }

  return response.data.owner;
}
