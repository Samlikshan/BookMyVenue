import { apiRequest } from "@/lib/api";
import type {
  ApplyVenueSlotTemplatesPayload,
  CreateCustomVenueDateSlotPayload,
  CreateVenueAvailabilityPayload,
  CreateVenueInput,
  CreateVenueSlotTemplatePayload,
  UpdateVenueDateSlotPayload,
  UpdateVenueAvailabilityPayload,
  UpdateVenueInput,
  UpdateVenueSlotTemplatePayload,
  Venue,
  VenueAvailability,
  VenueDateSlot,
  VenueImage,
  VenueSlotTemplate,
  VenueVideo,
} from "./types";

export async function listPublicVenuesApi() {
  const response = await apiRequest<{ venues: Venue[] }>("/venues/public", {
    method: "GET",
  });

  return response.data?.venues ?? [];
}

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

export async function listVenueAvailabilityApi(
  venueId: string,
  accessToken: string,
) {
  const response = await apiRequest<VenueAvailability[]>(
    `/venues/${venueId}/availability`,
    {
      method: "GET",
      accessToken,
    },
  );
  return response.data ?? [];
}

export async function createVenueAvailabilityApi(
  venueId: string,
  payload: CreateVenueAvailabilityPayload,
  accessToken: string,
) {
  const response = await apiRequest<VenueAvailability>(
    `/venues/${venueId}/availability`,
    {
      method: "POST",
      body: payload,
      accessToken,
    },
  );
  return response.data ?? null;
}

export async function updateVenueAvailabilityApi(
  venueId: string,
  availabilityId: string,
  payload: UpdateVenueAvailabilityPayload,
  accessToken: string,
) {
  const response = await apiRequest<VenueAvailability>(
    `/venues/${venueId}/availability/${availabilityId}`,
    {
      method: "PATCH",
      body: payload,
      accessToken,
    },
  );
  return response.data ?? null;
}

export async function deleteVenueAvailabilityApi(
  venueId: string,
  availabilityId: string,
  accessToken: string,
) {
  const response = await apiRequest<void>(
    `/venues/${venueId}/availability/${availabilityId}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
  return response.success;
}

export async function listVenueSlotTemplatesApi(
  venueId: string,
  accessToken: string,
) {
  const response = await apiRequest<VenueSlotTemplate[]>(
    `/venues/${venueId}/slot-templates`,
    {
      method: "GET",
      accessToken,
    },
  );
  return response.data ?? [];
}

export async function createVenueSlotTemplateApi(
  venueId: string,
  payload: CreateVenueSlotTemplatePayload,
  accessToken: string,
) {
  const response = await apiRequest<VenueSlotTemplate>(
    `/venues/${venueId}/slot-templates`,
    {
      method: "POST",
      body: payload,
      accessToken,
    },
  );
  return response.data ?? null;
}

export async function updateVenueSlotTemplateApi(
  venueId: string,
  slotTemplateId: string,
  payload: UpdateVenueSlotTemplatePayload,
  accessToken: string,
) {
  const response = await apiRequest<VenueSlotTemplate>(
    `/venues/${venueId}/slot-templates/${slotTemplateId}`,
    {
      method: "PATCH",
      body: payload,
      accessToken,
    },
  );
  return response.data ?? null;
}

export async function deleteVenueSlotTemplateApi(
  venueId: string,
  slotTemplateId: string,
  accessToken: string,
) {
  const response = await apiRequest<void>(
    `/venues/${venueId}/slot-templates/${slotTemplateId}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
  return response.success;
}

export async function listVenueDateSlotsApi(
  venueId: string,
  from: string,
  to: string,
  accessToken: string,
) {
  const response = await apiRequest<VenueDateSlot[]>(
    `/venues/${venueId}/date-slots`,
    {
      method: "GET",
      params: { from, to },
      accessToken,
    },
  );
  return response.data ?? [];
}

export async function applyVenueSlotTemplatesApi(
  venueId: string,
  payload: ApplyVenueSlotTemplatesPayload,
  accessToken: string,
) {
  const response = await apiRequest<{
    created: VenueDateSlot[];
    skippedDuplicates: { date: string; startTime: string; endTime: string }[];
  }>(`/venues/${venueId}/date-slots/apply-templates`, {
    method: "POST",
    body: payload,
    accessToken,
  });
  return response.data ?? { created: [], skippedDuplicates: [] };
}

export async function createCustomVenueDateSlotApi(
  venueId: string,
  payload: CreateCustomVenueDateSlotPayload,
  accessToken: string,
) {
  const response = await apiRequest<VenueDateSlot>(
    `/venues/${venueId}/date-slots/custom`,
    {
      method: "POST",
      body: payload,
      accessToken,
    },
  );
  return response.data ?? null;
}

export async function updateVenueDateSlotApi(
  venueId: string,
  dateSlotId: string,
  payload: UpdateVenueDateSlotPayload,
  accessToken: string,
) {
  const response = await apiRequest<VenueDateSlot>(
    `/venues/${venueId}/date-slots/${dateSlotId}`,
    {
      method: "PATCH",
      body: payload,
      accessToken,
    },
  );
  return response.data ?? null;
}

export async function deleteVenueDateSlotApi(
  venueId: string,
  dateSlotId: string,
  accessToken: string,
) {
  const response = await apiRequest<void>(
    `/venues/${venueId}/date-slots/${dateSlotId}`,
    {
      method: "DELETE",
      accessToken,
    },
  );
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
