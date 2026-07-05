import { z } from "zod";
import { assertStartBeforeEnd, isValidHHMM } from "../utils/time.js";

const timeSchema = z
  .string()
  .refine(isValidHHMM, "Time must be in HH:mm 24-hour format");

const dayOfWeekSchema = z
  .number()
  .int("dayOfWeek must be an integer")
  .min(0, "dayOfWeek must be between 0 and 6")
  .max(6, "dayOfWeek must be between 0 and 6");

const priceOverrideSchema = z
  .number()
  .finite()
  .positive("priceOverride must be greater than zero")
  .nullable()
  .optional();

function refineTimeRange(
  data: { startTime?: string; endTime?: string },
  ctx: z.RefinementCtx
) {
  if (data.startTime === undefined || data.endTime === undefined) return;

  try {
    assertStartBeforeEnd(data.startTime, data.endTime);
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        error instanceof Error
          ? error.message
          : "startTime must be less than endTime",
      path: ["startTime"],
    });
  }
}

export const createVenueAvailabilitySchema = z
  .object({
    dayOfWeek: dayOfWeekSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    priceOverride: priceOverrideSchema,
  })
  .strict()
  .superRefine(refineTimeRange);

export const updateVenueAvailabilitySchema = z
  .object({
    dayOfWeek: dayOfWeekSchema.optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    isActive: z.boolean().optional(),
    priceOverride: priceOverrideSchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .superRefine(refineTimeRange);

export type CreateVenueAvailabilityInput = z.infer<
  typeof createVenueAvailabilitySchema
>;
export type UpdateVenueAvailabilityInput = z.infer<
  typeof updateVenueAvailabilitySchema
>;

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

export const createVenueSlotTemplateSchema = z
  .object({
    name: z.string().trim().min(1).nullable().optional(),
    startTime: timeSchema,
    endTime: timeSchema,
    priceOverride: priceOverrideSchema,
  })
  .strict()
  .superRefine(refineTimeRange);

export const updateVenueSlotTemplateSchema = z
  .object({
    name: z.string().trim().min(1).nullable().optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    isActive: z.boolean().optional(),
    priceOverride: priceOverrideSchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .superRefine(refineTimeRange);

export const listVenueDateSlotsQuerySchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
  })
  .strict();

export const applyVenueSlotTemplatesSchema = z
  .object({
    dates: z.array(dateOnlySchema).min(1, "At least one date is required"),
    slotTemplateIds: z
      .array(z.string().uuid("Invalid slot template ID"))
      .min(1, "At least one slot template is required"),
    mode: z.literal("MERGE"),
  })
  .strict();

export const createCustomVenueDateSlotSchema = z
  .object({
    date: dateOnlySchema,
    startTime: timeSchema,
    endTime: timeSchema,
    priceOverride: priceOverrideSchema,
  })
  .strict()
  .superRefine(refineTimeRange);

export const updateVenueDateSlotSchema = z
  .object({
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    isAvailable: z.boolean().optional(),
    priceOverride: priceOverrideSchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  })
  .superRefine(refineTimeRange);

export type CreateVenueSlotTemplateInput = z.infer<
  typeof createVenueSlotTemplateSchema
>;
export type UpdateVenueSlotTemplateInput = z.infer<
  typeof updateVenueSlotTemplateSchema
>;
export type ListVenueDateSlotsQuery = z.infer<
  typeof listVenueDateSlotsQuerySchema
>;
export type ApplyVenueSlotTemplatesInput = z.infer<
  typeof applyVenueSlotTemplatesSchema
>;
export type CreateCustomVenueDateSlotInput = z.infer<
  typeof createCustomVenueDateSlotSchema
>;
export type UpdateVenueDateSlotInput = z.infer<
  typeof updateVenueDateSlotSchema
>;
