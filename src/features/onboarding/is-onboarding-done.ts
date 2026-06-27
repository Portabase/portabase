import "server-only";

import { db } from "@/db";

export async function isOnboardingDone(): Promise<boolean> {
    const settings = await db.query.setting.findFirst();
    return settings?.onboarding ?? false;
}
