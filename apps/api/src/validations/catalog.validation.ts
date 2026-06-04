import { z } from "zod";

export const createEventTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>;
