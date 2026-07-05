import type { VenueImage } from "../venues/types";

export type BookingStatus = "PAYMENT_PENDING" | "CONFIRMED" | "PAYMENT_FAILED" | "EXPIRED" | "CANCELLED" | "COMPLETED";
export interface PricedSlot { startTime: string; endTime: string; price: number; status: "AVAILABLE" | "BOOKED" | "BLOCKED"; }
export interface VenueAvailabilityResponse { venueId: string; date: string; currency: string; slots: PricedSlot[]; }
export interface BookingSlot { id: string; startTime: string; endTime: string; price: number; date: string; }
export interface Booking {
  id: string; bookingDate: string; status: BookingStatus; totalAmount: number; totalSlots: number;
  paymentExpiresAt: string | null; paymentMockId: string | null; notes: string | null; createdAt: string; currency: string;
  venue: { id: string; name: string; slug: string; city: string; state: string; currency: string; images: VenueImage[] };
  slots: BookingSlot[];
}
