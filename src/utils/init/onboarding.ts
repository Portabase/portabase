import { db } from "@/db";
import * as drizzleDb from "@/db";
import { eq } from "drizzle-orm";
import { env } from "@/env.mjs";
import { logger } from "@/lib/logger";

const log = logger.child({ module: "init/onboarding" });

export async function markOnboardingDoneIfSkipped() {
  if (env.SKIP_ONBOARDING !== "true") return;

  await db
    .update(drizzleDb.schemas.setting)
    .set({ onboarding: true })
    .where(eq(drizzleDb.schemas.setting.name, "system"));

  log.info("SKIP_ONBOARDING=true: marked onboarding as done.");
}
