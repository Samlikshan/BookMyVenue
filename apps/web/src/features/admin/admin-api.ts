import { apiRequest } from "@/lib/api";
import type { AuthUser } from "../auth/types";
import type { Venue } from "../venues/types";

// Pending Owners
export async function listPendingOwnersApi(accessToken: string) {
  const response = await apiRequest<{ owners: AuthUser[] }>(
    "/admin/owners/pending",
    {
      method: "GET",
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
  return response.data?.owner ?? null;
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
      body: { rejectionReason },
      accessToken,
    },
  );
  return response.data?.owner ?? null;
}

// Pending Venues
export async function listAdminVenuesApi(
  status: string | null,
  accessToken: string,
) {
  const path = status ? `/admin/venues?status=${status}` : "/admin/venues";
  const response = await apiRequest<{ venues: Venue[] }>(path, {
    method: "GET",
    accessToken,
  });
  return response.data?.venues ?? [];
}

export async function approveVenueApi(venueId: string, accessToken: string) {
  const response = await apiRequest<{ venue: Venue }>(
    `/admin/venues/${venueId}/approve`,
    {
      method: "PATCH",
      accessToken,
    },
  );
  return response.data?.venue ?? null;
}

export async function rejectVenueApi(
  venueId: string,
  rejectionReason: string,
  accessToken: string,
) {
  const response = await apiRequest<{ venue: Venue }>(
    `/admin/venues/${venueId}/reject`,
    {
      method: "PATCH",
      body: { rejectionReason },
      accessToken,
    },
  );
  return response.data?.venue ?? null;
}
