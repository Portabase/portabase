import {z} from "zod";

export const AddMemberSchema = z.object({
    userId: z.string().min(1, "Invalid field"),
});

export const UpdateOrganizationSchema = z.object({
    name: z.string().min(5),
});

export const OrganizationSchema = z.object({
    name: z.string(),
});

export const OrganizationInvitationSchema = z.object({
    email: z.string(),
    invitedByUsername: z.string(),
    invitedByEmail: z.string(),
    teamName: z.string(),
    inviteLink: z.string()
});

export type OrganizationInvitationType = z.infer<typeof OrganizationInvitationSchema>;
export type OrganizationSchema = z.infer<typeof OrganizationSchema>;
export type UpdateOrganizationSchemaType = z.infer<typeof UpdateOrganizationSchema>;
export type AddMemberSchemaType = z.infer<typeof AddMemberSchema>;
