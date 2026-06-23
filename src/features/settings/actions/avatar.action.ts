"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { userAction } from "@/lib/safe-actions/actions";
import { withUpdatedAt } from "@/db/utils";
import { ServerActionResult } from "@/types/action-type";
import { Setting } from "@/db/schema/01_setting";

const AVATAR_MODES = ['internal', 'gravatar', 'dicebear'] as const;

export const updateAvatarModeAction = userAction
    .schema(z.object({
        name: z.string(),
        avatarMode: z.enum(AVATAR_MODES),
        dicebearStyle: z.string().optional(),
    }))
    .action(async ({ parsedInput }): Promise<ServerActionResult<Setting>> => {
        const { name, avatarMode, dicebearStyle } = parsedInput;
        try {
            const [updated] = await db
                .update(drizzleDb.schemas.setting)
                .set(withUpdatedAt({
                    avatarMode,
                    ...(dicebearStyle ? { dicebearStyle } : {}),
                }))
                .where(eq(drizzleDb.schemas.setting.name, name))
                .returning();
            return { success: true, value: updated, actionSuccess: { message: "Avatar mode updated." } };
        } catch (_error) {
            return {
                success: false,
                actionError: {
                    message: "Failed to update avatar mode.",
                    status: 500,
                    cause: _error instanceof Error ? _error.message : "Unknown error",
                },
            };
        }
    });
