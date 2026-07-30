import { z } from "zod";

export const AgentSchema = z.object({
    name: z.string().nonempty("Name is required"),
    description: z.string(),
    overrideUrl: z
        .union([z.literal(""), z.string().url("Enter a valid URL")])
        .nullish()
        .transform((v) => (v ? v : null)),
});

export type AgentType = z.infer<typeof AgentSchema>;
