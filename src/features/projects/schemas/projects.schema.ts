import { z } from "zod";

export const ProjectSchema = z.object({
    name: z.string().nonempty("Name is required"),
    databases: z.array(z.string()),
});

export type ProjectType = z.infer<typeof ProjectSchema>;
