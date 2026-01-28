import { z } from "zod";

export const AgentSchema = z.object({
    name: z.string().nonempty("Name is required"),
    description: z.string(),
});

export type AgentType = z.infer<typeof AgentSchema>;
