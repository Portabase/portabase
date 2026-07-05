"use server"

import {userAction} from "@/lib/safe-actions/actions";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq} from "drizzle-orm";
import {ServerActionResult} from "@/types/action-type";
import {Setting} from "@/db/schema/01_setting";
import {z} from "zod";
import {DefaultStorageSchema} from "@/features/settings/schemas/storage.schema";
import {withUpdatedAt} from "@/db/utils";

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
                .set(withUpdatedAt({
                    defaultStorageChannelId: data.storageChannelId ?? null,
                    encryption: data.encryption,
                }))
                .where(eq(drizzleDb.schemas.setting.name, name))
                .returning();
            return {
                success: true,
                value: updatedSettings,
                actionSuccess: {
                    message: "Settings successfully updated",
                },
            };
        } catch (_error) {
            return {
                success: false,
                actionError: {
                    message: "Failed update settings.",
                    status: 500,
                    cause: _error instanceof Error ? _error.message : "Unknown error",
                },
            };
        }
    });
