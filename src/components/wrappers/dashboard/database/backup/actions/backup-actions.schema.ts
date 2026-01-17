"use client";

import { z } from "zod";
import {zString} from "@/lib/zod";

export const BackupActionsSchema = z.object({
    backupStorageId: zString(),
});

export type BackupActionsType = z.infer<typeof BackupActionsSchema>;
