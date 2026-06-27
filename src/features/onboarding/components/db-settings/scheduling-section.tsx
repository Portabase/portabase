"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BackupScheduleSelector,
  type BackupScheduleValue,
} from "@/features/onboarding/components/backup-schedule-selector";
import { DEFAULT_SCHEDULE } from "@/features/onboarding/constants/db-settings";
import type { OnboardingDbSettings } from "@/features/onboarding/types";

type SchedulingSectionProps = {
  initial: Pick<OnboardingDbSettings, "backupMethod" | "backupCron">;
  onSave: (method: "manual" | "automatic", cron?: string) => Promise<void>;
  isPending: boolean;
};

export const SchedulingSection = ({
  initial,
  onSave,
  isPending,
}: SchedulingSectionProps) => {
  const [schedule, setSchedule] = useState<BackupScheduleValue>({
    method: initial.backupMethod ?? DEFAULT_SCHEDULE.method,
    cron: initial.backupCron ?? DEFAULT_SCHEDULE.cron,
  });

  return (
    <div className="flex flex-col gap-6">
      <BackupScheduleSelector value={schedule} onChange={setSchedule} />
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          disabled={isPending}
          onClick={() => onSave(schedule.method, schedule.cron)}
          className="ml-auto"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};
