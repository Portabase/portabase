"use server";
import { z } from "zod";
import { EmailFormSchema } from "@/components/wrappers/dashboard/admin/settings/email/email-form/email-form.schema";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import {userAction} from "@/lib/safe-actions/actions";
import {withUpdatedAt} from "@/db/utils";

export const updateEmailSettingsAction = userAction
    .schema(
        z.object({
            name: z.string(),
            data: EmailFormSchema,
        })
    )
    .action(async ({ parsedInput }) => {
        const { name, data } = parsedInput;

        const [updatedSettings] = await db
            .update(drizzleDb.schemas.setting)
            .set(withUpdatedAt({
                ...data,
            }))
            .where(eq(drizzleDb.schemas.setting.name, name))
            .returning();

        return {
            data: updatedSettings,
        };
    });
