"use client";

import { ChannelPoliciesForm } from "@/features/database/components/channels-policy-form";
import type { EventKind, OnboardingChannel, OnboardingNotificationPolicy } from "@/features/onboarding/types";
import type { PolicyType } from "@/features/database/schemas/channels-policy.schema";

type NotificationsSectionProps = {
    initial: OnboardingNotificationPolicy[];
    notifiers: OnboardingChannel[];
    onSave: (policies: OnboardingNotificationPolicy[]) => Promise<void>;
    isPending: boolean;
};

export const NotificationsSection = ({ initial, notifiers, onSave, isPending }: NotificationsSectionProps) => (
    <ChannelPoliciesForm
        channels={notifiers}
        defaultPolicies={initial as PolicyType[]}
        kind="notification"
        isPending={isPending}
        onSave={async (policies: PolicyType[]) =>
            onSave(
                policies.map((p) => ({
                    channelId: p.channelId,
                    eventKinds: (p.eventKinds ?? []) as EventKind[],
                    enabled: p.enabled,
                })),
            )
        }
        noChannelsMessage={
            <p className="text-xs text-muted-foreground">
                Go back and configure notifiers in the &quot;Connect a notifier&quot; step first.
            </p>
        }
    />
);
