import type { Request, Response } from "express";
import { paramString } from "../utils/params.util.js";
import { availabilityQuerySchema, initiateBookingSchema } from "../validations/booking.validation.js";
import { availabilityService, cancelBookingService, completePaymentService, failPaymentService, getBookingService, initiateBookingService, listMyBookingsService } from "../services/booking.service.js";

function validationError(res: Response, errors: unknown) { return res.status(400).json({ success: false, message: "Validation failed", errors }); }

export async function getAvailability(req: Request, res: Response) {
  const parsed = availabilityQuerySchema.safeParse(req.query);
  if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);
  const result = await availabilityService(paramString(req.params.venueId, "venueId"), parsed.data.date);
  return res.status(result.statusCode).json(result);
}
export async function initiateBooking(req: Request, res: Response) {
  const parsed = initiateBookingSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error.flatten().fieldErrors);
  const result = await initiateBookingService(req.user!.profile.id, parsed.data);
  return res.status(result.statusCode).json(result);
}
export async function paymentSuccess(req: Request, res: Response) { const result = await completePaymentService(req.user!.profile.id, paramString(req.params.bookingId, "bookingId")); return res.status(result.statusCode).json(result); }
export async function paymentFailure(req: Request, res: Response) { const result = await failPaymentService(req.user!.profile.id, paramString(req.params.bookingId, "bookingId")); return res.status(result.statusCode).json(result); }
export async function listMyBookings(req: Request, res: Response) { const result = await listMyBookingsService(req.user!.profile.id); return res.status(result.statusCode).json(result); }
export async function getBooking(req: Request, res: Response) { const result = await getBookingService(req.user!.profile, paramString(req.params.bookingId, "bookingId")); return res.status(result.statusCode).json(result); }
export async function cancelBooking(req: Request, res: Response) { const result = await cancelBookingService(req.user!.profile.id, paramString(req.params.bookingId, "bookingId")); return res.status(result.statusCode).json(result); }
