import {z} from "zod";

export const AgentOrganizationSchema = z.object({
    organizations: z.array(z.string().uuid())
});

export type AgentOrganizationType = z.infer<typeof AgentOrganizationSchema>;
