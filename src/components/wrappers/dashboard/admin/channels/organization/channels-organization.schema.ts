import {z} from "zod";

export const ChannelsOrganizationSchema = z.object({
    organizations: z.array(z.string().uuid())
});

export type ChannelsOrganizationType = z.infer<typeof ChannelsOrganizationSchema>;
