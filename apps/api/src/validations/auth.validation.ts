import { z } from "zod";

export const registerOwnerSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  businessName: z.string().min(2, "Business name is required"),
  city: z.string().min(2, "City is required"),
});

export type RegisterOwnerInput = z.infer<typeof registerOwnerSchema>;