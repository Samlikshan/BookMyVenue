import { randomUUID } from "node:crypto";
import { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../config/prisma.js";
import { normalizeDateOnly, serviceError, type ServiceResult, type TransactionClient } from "./venue-calendar-availability.helpers.js";
import { releaseExpiredPendingBookings } from "./booking-expiry.service.js";
import type { InitiateBookingInput } from "../validations/booking.validation.js";

const blockingStatuses = ["PAYMENT_PENDING", "CONFIRMED", "COMPLETED"] as const;
const bookingInclude = { venue: { select: { id: true, name: true, slug: true, city: true, state: true, currency: true, images: { where: { isPrimary: true }, take: 1 } } }, slots: { orderBy: { startTime: "asc" as const } } };

function serializeBooking<T extends { totalAmount: Prisma.Decimal; slots: { price: Prisma.Decimal }[]; venue: { currency: string } }>(booking: T) {
  return { ...booking, totalAmount: booking.totalAmount.toNumber(), currency: booking.venue.currency, slots: booking.slots.map((slot) => ({ ...slot, price: slot.price.toNumber() })) };
}

function todayUtc() { return new Date().toISOString().slice(0, 10); }

export async function getBookableAvailability(venueId: string, dateText: string, tx: TransactionClient = prisma) {
  const date = normalizeDateOnly(dateText);
  await releaseExpiredPendingBookings(tx);
  const venue = await tx.venue.findFirst({ where: { id: venueId, status: "ACTIVE", deletedAt: null }, select: { id: true, currency: true, basePricePerSlot: true } });
  if (!venue) throw Object.assign(new Error("Venue not found or unavailable"), { statusCode: 404 });
  const [dateSlots, locks] = await Promise.all([
    tx.venueDateSlot.findMany({ where: { venueId, date }, orderBy: { startTime: "asc" } }),
    tx.bookingSlot.findMany({ where: { venueId, date, booking: { status: { in: [...blockingStatuses] } } }, select: { startTime: true, endTime: true } }),
  ]);
  const locked = new Set(locks.map((slot) => `${slot.startTime}|${slot.endTime}`));
  return {
    venueId, date: dateText, currency: venue.currency,
    slots: dateSlots.map((slot) => ({
      startTime: slot.startTime, endTime: slot.endTime,
      status: locked.has(`${slot.startTime}|${slot.endTime}`) ? "BOOKED" : slot.isAvailable ? "AVAILABLE" : "BLOCKED",
      price: (slot.priceOverride ?? venue.basePricePerSlot).toNumber(),
    })),
  };
}

export async function availabilityService(venueId: string, date: string): Promise<ServiceResult> {
  try { return { success: true, statusCode: 200, message: "Availability fetched successfully", data: await prisma.$transaction((tx) => getBookableAvailability(venueId, date, tx)) }; }
  catch (error) { return serviceError(Number((error as any)?.statusCode ?? 500), error instanceof Error ? error.message : "Unexpected availability error"); }
}

export async function initiateBookingService(userId: string, input: InitiateBookingInput): Promise<ServiceResult> {
  try {
    if (input.date < todayUtc()) return serviceError(400, "Booking date cannot be in the past");
    const result = await prisma.$transaction(async (tx) => {
      await releaseExpiredPendingBookings(tx);
      const venue = await tx.venue.findFirst({ where: { id: input.venueId, status: "ACTIVE", deletedAt: null } });
      if (!venue) throw Object.assign(new Error("Venue not found or unavailable"), { statusCode: 404 });
      if (venue.ownerId === userId) throw Object.assign(new Error("You cannot book your own venue"), { statusCode: 403 });
      const availability = await getBookableAvailability(input.venueId, input.date, tx);
      const available = new Map(availability.slots.filter((slot) => slot.status === "AVAILABLE").map((slot) => [`${slot.startTime}|${slot.endTime}`, slot]));
      const selected = input.slots.map((slot) => available.get(`${slot.startTime}|${slot.endTime}`));
      if (selected.some((slot) => !slot)) throw Object.assign(new Error("One or more selected slots are no longer available."), { statusCode: 409 });
      const total = selected.reduce((sum, slot) => sum + slot!.price, 0);
      return tx.booking.create({
        data: {
          userId, venueId: venue.id, ownerId: venue.ownerId, bookingDate: normalizeDateOnly(input.date),
          totalAmount: total, totalSlots: input.slots.length, notes: input.notes || null,
          paymentExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
          slots: { create: input.slots.map((slot, index) => ({ venueId: venue.id, date: normalizeDateOnly(input.date), ...slot, price: selected[index]!.price })) },
        }, include: bookingInclude,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000 });
    return { success: true, statusCode: 201, message: "Booking initiated successfully", data: serializeBooking(result) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && (error.code === "P2002" || error.code === "P2034")) return serviceError(409, "One or more selected slots are no longer available.");
    return serviceError(Number((error as any)?.statusCode ?? 500), error instanceof Error ? error.message : "Unable to initiate booking");
  }
}

export async function completePaymentService(userId: string, bookingId: string): Promise<ServiceResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findFirst({ where: { id: bookingId, userId }, include: bookingInclude });
      if (!current) throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
      if (current.status !== "PAYMENT_PENDING") throw Object.assign(new Error("Booking is not awaiting payment"), { statusCode: 400 });
      if (!current.paymentExpiresAt || current.paymentExpiresAt <= new Date()) {
        await tx.bookingSlot.deleteMany({ where: { bookingId } });
        await tx.booking.update({ where: { id: bookingId }, data: { status: "EXPIRED", paymentExpiresAt: null } });
        return { expired: true as const };
      }
      await releaseExpiredPendingBookings(tx);
      return { expired: false as const, booking: await tx.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED", paymentExpiresAt: null, paymentMockId: `mock_pay_${randomUUID().replaceAll("-", "")}` }, include: bookingInclude }) };
    });
    if (result.expired) return serviceError(409, "Payment session expired. Please try booking again.");
    return { success: true, statusCode: 200, message: "Payment completed and booking confirmed", data: serializeBooking(result.booking) };
  } catch (error) { return serviceError(Number((error as any)?.statusCode ?? 500), error instanceof Error ? error.message : "Unable to complete payment"); }
}

export async function failPaymentService(userId: string, bookingId: string): Promise<ServiceResult> {
  return transitionAndRelease(userId, bookingId, "PAYMENT_FAILED", "Payment failure recorded");
}
export async function cancelBookingService(userId: string, bookingId: string): Promise<ServiceResult> {
  return transitionAndRelease(userId, bookingId, "CANCELLED", "Booking cancelled", true);
}

async function transitionAndRelease(userId: string, bookingId: string, status: "PAYMENT_FAILED" | "CANCELLED", message: string, cancellation = false): Promise<ServiceResult> {
  try {
    const booking = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findFirst({ where: { id: bookingId, userId } });
      if (!current) throw Object.assign(new Error("Booking not found"), { statusCode: 404 });
      if (cancellation ? !["PAYMENT_PENDING", "CONFIRMED"].includes(current.status) : current.status !== "PAYMENT_PENDING") throw Object.assign(new Error(cancellation ? "This booking cannot be cancelled" : "Booking is not awaiting payment"), { statusCode: 400 });
      await tx.bookingSlot.deleteMany({ where: { bookingId } });
      return tx.booking.update({ where: { id: bookingId }, data: { status, paymentExpiresAt: null }, include: bookingInclude });
    });
    return { success: true, statusCode: 200, message, data: serializeBooking(booking) };
  } catch (error) { return serviceError(Number((error as any)?.statusCode ?? 500), error instanceof Error ? error.message : message); }
}

export async function listMyBookingsService(userId: string): Promise<ServiceResult> {
  await prisma.$transaction(releaseExpiredPendingBookings);
  const bookings = await prisma.booking.findMany({ where: { userId }, include: bookingInclude, orderBy: { createdAt: "desc" } });
  return { success: true, statusCode: 200, message: "Bookings fetched successfully", data: { bookings: bookings.map(serializeBooking) } };
}

export async function getBookingService(profile: { id: string; role: string }, bookingId: string): Promise<ServiceResult> {
  await prisma.$transaction(releaseExpiredPendingBookings);
  const booking = await prisma.booking.findFirst({ where: { id: bookingId, ...(profile.role === "ADMIN" ? {} : profile.role === "OWNER" ? { ownerId: profile.id } : { userId: profile.id }) }, include: bookingInclude });
  return booking ? { success: true, statusCode: 200, message: "Booking fetched successfully", data: serializeBooking(booking) } : serviceError(404, "Booking not found");
}
