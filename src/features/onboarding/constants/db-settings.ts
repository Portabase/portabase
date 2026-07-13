import type { OnboardingDbSettings } from "@/features/onboarding/types";
import type { BackupScheduleValue } from "@/features/onboarding/components/backup-schedule-selector";

export const DEFAULT_RETENTION: NonNullable<OnboardingDbSettings["retention"]> =
  {
    type: "gfs",
    count: 7,
    days: 30,
    gfs: { daily: 7, weekly: 4, monthly: 12, yearly: 3 },
  };

export const DEFAULT_SCHEDULE: BackupScheduleValue = {
  method: "automatic",
  cron: "0 0 * * *",
};
