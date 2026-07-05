import { z } from "zod";

const venueStatusSchema = z.enum([
  "DRAFT",
  "PENDING_APPROVAL",
  "ACTIVE",
  "REJECTED",
  "SUSPENDED",
]);

const optionalVenueFields = {
  shortDescription: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  capacityMin: z.number().int().positive().nullable().optional(),
  capacityMax: z.number().int().positive().nullable().optional(),
  addressLine2: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  country: z.string().min(1).optional(),
  postalCode: z.string().nullable().optional(),
  eventTypeIds: z.array(z.string().cuid()).optional(),
  amenityNames: z.array(z.string().min(1)).optional(),
  status: venueStatusSchema.optional(),
};

const priceSchema = z.number().finite().positive("Price must be greater than zero");

function capacityRefine(
  data: { capacityMin?: number | null; capacityMax?: number | null },
  ctx: z.RefinementCtx
) {
  if (
    data.capacityMin != null &&
    data.capacityMax != null &&
    data.capacityMin > data.capacityMax
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "capacityMin cannot be greater than capacityMax",
      path: ["capacityMin"],
    });
  }
}

export const createVenueSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    addressLine1: z.string().min(1, "Address line 1 is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    basePricePerSlot: priceSchema,
    currency: z.string().trim().length(3).toUpperCase().optional(),
    ...optionalVenueFields,
  })
  .superRefine(capacityRefine);

export const updateVenueSchema = z
  .object({
    name: z.string().min(2).optional(),
    addressLine1: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    state: z.string().min(1).optional(),
    basePricePerSlot: priceSchema.optional(),
    currency: z.string().trim().length(3).toUpperCase().optional(),
    ...optionalVenueFields,
  })
  .superRefine(capacityRefine);

export const rejectVenueSchema = z.object({
  rejectionReason: z
    .string()
    .min(5, "Rejection reason must be at least 5 characters"),
});

export const approveVenueSchema = z.object({
  reviewedBy: z.string().uuid().optional(),
});

export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
export type RejectVenueInput = z.infer<typeof rejectVenueSchema>;
export type ApproveVenueInput = z.infer<typeof approveVenueSchema>;
