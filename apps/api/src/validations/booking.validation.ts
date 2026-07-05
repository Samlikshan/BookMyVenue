import { z } from "zod";
import { isValidHHMM } from "../utils/time.js";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const timeSchema = z.string().refine(isValidHHMM, "Time must be HH:mm");

export const initiateBookingSchema = z.object({
  venueId: z.string().cuid("Invalid venue ID"),
  date: dateSchema,
  slots: z.array(z.object({ startTime: timeSchema, endTime: timeSchema }).strict())
    .min(1, "At least one slot is required")
    .max(24, "Too many slots selected"),
  notes: z.string().trim().max(1000).optional(),
}).strict().superRefine((data, ctx) => {
  const keys = data.slots.map((slot) => `${slot.startTime}|${slot.endTime}`);
  if (new Set(keys).size !== keys.length) {
    ctx.addIssue({ code: "custom", path: ["slots"], message: "Duplicate slots are not allowed" });
  }
  data.slots.forEach((slot, index) => {
    if (slot.startTime >= slot.endTime) {
      ctx.addIssue({ code: "custom", path: ["slots", index, "startTime"], message: "startTime must be before endTime" });
    }
  });
});

export const availabilityQuerySchema = z.object({ date: dateSchema }).strict();
export type InitiateBookingInput = z.infer<typeof initiateBookingSchema>;
