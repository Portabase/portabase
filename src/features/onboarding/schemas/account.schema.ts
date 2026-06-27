import { z } from "zod";

export const BaseSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
});

export const WithPasswordSchema = BaseSchema.extend({
  password: z.string().min(8, "Min. 8 characters"),
});
