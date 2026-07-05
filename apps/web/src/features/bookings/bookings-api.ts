import { apiRequest } from "@/lib/api";
import type { Booking, VenueAvailabilityResponse } from "./types";

export async function getAvailabilityApi(venueId: string, date: string) {
  const response = await apiRequest<VenueAvailabilityResponse>(`/venues/${venueId}/bookable-availability?date=${encodeURIComponent(date)}`);
  return response.data!;
}
export async function initiateBookingApi(input: { venueId: string; date: string; slots: { startTime: string; endTime: string }[]; notes?: string }, token: string) {
  const response = await apiRequest<Booking>("/bookings/initiate", { method: "POST", body: input, accessToken: token }); return response.data!;
}
export async function getBookingApi(id: string, token: string) { const response = await apiRequest<Booking>(`/bookings/${id}`, { accessToken: token }); return response.data!; }
export async function listMyBookingsApi(token: string) { const response = await apiRequest<{ bookings: Booking[] }>("/bookings/my", { accessToken: token }); return response.data?.bookings ?? []; }
export async function paymentSuccessApi(id: string, token: string) { const response = await apiRequest<Booking>(`/bookings/${id}/payment/success`, { method: "PATCH", accessToken: token }); return response.data!; }
export async function paymentFailureApi(id: string, token: string) { const response = await apiRequest<Booking>(`/bookings/${id}/payment/failure`, { method: "PATCH", accessToken: token }); return response.data!; }
export async function cancelBookingApi(id: string, token: string) { const response = await apiRequest<Booking>(`/bookings/${id}/cancel`, { method: "PATCH", accessToken: token }); return response.data!; }
