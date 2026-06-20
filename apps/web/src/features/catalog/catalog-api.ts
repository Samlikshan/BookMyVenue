import { apiRequest } from "@/lib/api";
import type { EventType } from "../venues/types";

export async function listEventTypesApi(accessToken: string) {
  const response = await apiRequest<{ eventTypes: EventType[] }>(
    "/catalog/event-types",
    {
      method: "GET",
      accessToken,
    },
  );
  return response.data?.eventTypes ?? [];
}
