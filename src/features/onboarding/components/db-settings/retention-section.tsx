"use client";

import { BackupRetentionSettingsForm } from "@/features/database/components/retention-policy-form";
import { DEFAULT_RETENTION } from "@/features/onboarding/constants/db-settings";
import type { OnboardingDbSettings } from "@/features/onboarding/types";

type RetentionSectionProps = {
    initial: OnboardingDbSettings["retention"];
    onSave: (value: NonNullable<OnboardingDbSettings["retention"]>) => Promise<void>;
    isPending: boolean;
};

export const RetentionSection = ({ initial, onSave, isPending }: RetentionSectionProps) => (
    <BackupRetentionSettingsForm
        defaultValues={initial ?? DEFAULT_RETENTION}
        isPending={isPending}
        onSave={async (values) =>
            onSave({
                type: values.type,
                count: values.count ?? DEFAULT_RETENTION.count,
                days: values.days ?? DEFAULT_RETENTION.days,
                gfs: {
                    daily: values.gfs?.daily ?? DEFAULT_RETENTION.gfs.daily,
                    weekly: values.gfs?.weekly ?? DEFAULT_RETENTION.gfs.weekly,
                    monthly: values.gfs?.monthly ?? DEFAULT_RETENTION.gfs.monthly,
                    yearly: values.gfs?.yearly ?? DEFAULT_RETENTION.gfs.yearly,
                },
            })
        }
    />
);
