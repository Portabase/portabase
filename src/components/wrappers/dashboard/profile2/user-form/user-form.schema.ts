import {z} from "zod";

export const UserSchema = z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
});

export type UserType = z.infer<typeof UserSchema>;
