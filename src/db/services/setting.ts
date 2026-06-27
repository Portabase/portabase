"use server";

import { db } from "@/db";

export async function getSettings() {
  return db.query.setting.findFirst();
}

export async function isOnboardingDone(): Promise<boolean> {
  const settings = await db.query.setting.findFirst();
  return settings?.onboarding ?? false;
}
