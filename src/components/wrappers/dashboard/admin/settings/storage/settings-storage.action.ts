"use server"

import {userAction} from "@/lib/safe-actions/actions";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq} from "drizzle-orm";
import {ServerActionResult} from "@/types/action-type";
import {Setting} from "@/db/schema/01_setting";
import {z} from "zod";
import {DefaultStorageSchema} from "@/components/wrappers/dashboard/admin/settings/storage/settings-storage.schema";

export const updateStorageSettingsAction = userAction
    .schema(
        z.object({
            name: z.string(),
            data: DefaultStorageSchema,
        })
    )
    .action(async ({parsedInput}): Promise<ServerActionResult<Setting>> => {
        const {name, data} = parsedInput;

        try {
            const [updatedSettings] = await db
                .update(drizzleDb.schemas.setting)
                .set({
                    defaultStorageChannelId: data.storageChannelId,
                    encryption: data.encryption,
                })
                .where(eq(drizzleDb.schemas.setting.name, name))
                .returning();
            return {
                success: true,
                value: updatedSettings,
                actionSuccess: {
                    message: "Settings successfully updated",
                },
            };
        } catch (error) {
            return {
                success: false,
                actionError: {
                    message: "Failed update settings.",
                    status: 500,
                    cause: error instanceof Error ? error.message : "Unknown error",
                },
            };
        }
    });


