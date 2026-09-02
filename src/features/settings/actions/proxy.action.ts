"use server";

import {eq} from "drizzle-orm";
import {z} from "zod";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {withUpdatedAt} from "@/db/utils";
import {ProxySettingsSchema} from "@/features/settings/schemas/proxy.schema";
import {userAction} from "@/lib/safe-actions/actions";

export const updateProxySettingsAction = userAction
    .inputSchema(z.object({
        name: z.string(),
        data: ProxySettingsSchema,
    }))
    .action(async ({parsedInput}) => {
        const [updatedSettings] = await db
            .update(drizzleDb.schemas.setting)
            .set(withUpdatedAt({
                httpProxy: parsedInput.data.httpProxy || null,
            }))
            .where(eq(drizzleDb.schemas.setting.name, parsedInput.name))
            .returning();

        return {data: updatedSettings};
    });
