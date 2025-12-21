import z from "zod";
import {zEmail} from "@/lib/zod";

export const EmailSchema = z.object({
    email: zEmail(),
});

export type EmailSchemaType = z.infer<typeof EmailSchema>;
