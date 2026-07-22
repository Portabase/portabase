"use client";

import { ChannelPoliciesForm } from "@/features/database/components/channels-policy-form";
import type { OnboardingChannel, OnboardingStoragePolicy } from "@/features/onboarding/types";
import type { PolicyType } from "@/features/database/schemas/channels-policy.schema";

type StorageSectionProps = {
    initial: OnboardingStoragePolicy[];
    storages: OnboardingChannel[];
    onSave: (policies: OnboardingStoragePolicy[]) => Promise<void>;
    isPending: boolean;
};

export const StorageSection = ({ initial, storages, onSave, isPending }: StorageSectionProps) => (
    <ChannelPoliciesForm
        channels={storages}
        defaultPolicies={initial}
        kind="storage"
        isPending={isPending}
        onSave={async (policies: PolicyType[]) =>
            onSave(
                policies.map((p) => ({
                    channelId: p.channelId,
                    enabled: p.enabled,
                })),
            )
        }
        noChannelsMessage={
            <p className="text-xs text-muted-foreground">
                Go back and configure storages in the &quot;Connect an external storage&quot; step first.
            </p>
        }
    />
);
