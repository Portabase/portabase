"use server";

import { userAction } from "@/lib/safe-actions/actions";
import { z } from "zod";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { setActiveOrganization } from "@/lib/auth/auth";
import { DEFAULT_ORGANIZATION_SLUG } from "@/features/organizations/constants";

export const markOnboardingDoneAction = userAction
  .inputSchema(z.object({}))
  .action(async () => {
    const settings = await db.query.setting.findFirst();
    if (!settings) {
      throw new Error("Settings not found");
    }
    await db
      .update(drizzleDb.schemas.setting)
      .set({ onboarding: true })
      .where(eq(drizzleDb.schemas.setting.id, settings.id));

    await setActiveOrganization(DEFAULT_ORGANIZATION_SLUG);

    return { done: true };
  });
