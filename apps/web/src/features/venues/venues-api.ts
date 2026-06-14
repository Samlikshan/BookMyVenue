import { apiRequest } from "@/lib/api";
import type {
  CreateVenueInput,
  UpdateVenueInput,
  Venue,
  VenueImage,
  VenueVideo,
} from "./types";

export async function listMyVenuesApi(accessToken: string) {
  const response = await apiRequest<{ venues: Venue[] }>("/venues", {
    method: "GET",
    accessToken,
  });
  return response.data?.venues ?? [];
}

export async function getVenueApi(venueId: string, accessToken: string) {
  const response = await apiRequest<{ venue: Venue }>(`/venues/${venueId}`, {
    method: "GET",
    accessToken,
  });
  return response.data?.venue ?? null;
}

export async function createVenueApi(input: CreateVenueInput, accessToken: string) {
  const response = await apiRequest<{ venue: Venue }>("/venues", {
    method: "POST",
    body: input,
    accessToken,
  });
  return response.data?.venue ?? null;
}

export async function updateVenueApi(
  venueId: string,
  input: UpdateVenueInput,
  accessToken: string,
) {
  const response = await apiRequest<{ venue: Venue }>(`/venues/${venueId}`, {
    method: "PATCH",
    body: input,
    accessToken,
  });
  return response.data?.venue ?? null;
}

export async function deleteVenueApi(venueId: string, accessToken: string) {
  const response = await apiRequest<void>(`/venues/${venueId}`, {
    method: "DELETE",
    accessToken,
  });
  return response.success;
}

// Media upload and management helpers
export async function createImageUploadUrlApi(
  venueId: string,
  fileName: string,
  contentType: string,
  accessToken: string,
) {
  const response = await apiRequest<{
    uploadUrl: string;
    storagePath: string;
    token: string;
    bucket: string;
  }>(`/venues/${venueId}/images/upload-url`, {
    method: "POST",
    body: { fileName, contentType },
    accessToken,
  });
  return response.data ?? null;
}

export async function confirmImageUploadApi(
  venueId: string,
  storagePath: string,
  accessToken: string,
) {
  const response = await apiRequest<{ image: VenueImage }>(
    `/venues/${venueId}/images/confirm`,
    {
      method: "POST",
      body: { storagePath },
      accessToken,
    },
  );
  return response.data?.image ?? null;
}

export async function setPrimaryImageApi(
  venueId: string,
  imageId: string,
  accessToken: string,
) {
  const response = await apiRequest<{ images: VenueImage[] }>(
    `/venues/${venueId}/images/${imageId}/primary`,
    {
      method: "PATCH",
      accessToken,
    },
  );
  return response.data?.images ?? [];
}

export async function deleteImageApi(
  venueId: string,
  imageId: string,
  accessToken: string,
) {
  const response = await apiRequest<void>(
    `/venues/${venueId}/images/${imageId}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
  return response.success;
}

export async function createVideoUploadUrlApi(
  venueId: string,
  fileName: string,
  contentType: string,
  accessToken: string,
) {
  const response = await apiRequest<{
    uploadUrl: string;
    storagePath: string;
    token: string;
    bucket: string;
  }>(`/venues/${venueId}/videos/upload-url`, {
    method: "POST",
    body: { fileName, contentType },
    accessToken,
  });
  return response.data ?? null;
}

export async function confirmVideoUploadApi(
  venueId: string,
  storagePath: string,
  accessToken: string,
) {
  const response = await apiRequest<{ video: VenueVideo }>(
    `/venues/${venueId}/videos/confirm`,
    {
      method: "POST",
      body: { storagePath },
      accessToken,
    },
  );
  return response.data?.video ?? null;
}

export async function deleteVideoApi(
  venueId: string,
  videoId: string,
  accessToken: string,
) {
  const response = await apiRequest<void>(
    `/venues/${venueId}/videos/${videoId}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
  return response.success;
}
