import z from "zod";
import {zString} from "@/lib/zod";

export const ProfileSchema = z.object({
    name: zString().nonempty(),
    role: zString().nonempty(),
});

export type ProfileSchemaType = z.infer<typeof ProfileSchema>;
