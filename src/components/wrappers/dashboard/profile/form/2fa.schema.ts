import { zString } from "@/lib/zod";
import { z } from "zod";

export const OtpSchema = z.object({
    code: zString().min(6, { message: "Le code doit contenir 6 chiffres" }),
});

export type OtpSchemaType = z.infer<typeof OtpSchema>;

export const BackupCodeSchema = z.object({
    code: zString().min(1, "Le code est requis"),
});

export type BackupCodeSchemaType = z.infer<typeof BackupCodeSchema>;
