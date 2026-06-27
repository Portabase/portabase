import { z } from "zod";

export const DatabaseSchema = z.object({
    name: z.string().readonly(),
    description: z.string().optional(),
    dbms: z.enum(["active", "inactive"]).readonly(),
});

export type DatabaseType = z.infer<typeof DatabaseSchema>;
