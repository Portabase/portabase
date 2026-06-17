"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { notificationProviders } from "@/features/channel/channels-notification-helper";
import { OnboardingChannel } from "@/features/onboarding/onboarding.types";

export const StepNotifier = () => {
    const { next, updateContext, state } = useOnboarding();
    const [selected, setSelected] = useState<string[]>([]);

    const toggle = (value: string) => {
        setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
    };

    const onContinue = async () => {
        const notifiers: OnboardingChannel[] = selected.map((providerId) => {
            const provider = notificationProviders.find((p) => p.value === providerId);
            return { id: providerId, provider: providerId, label: provider?.label ?? providerId };
        });
        await updateContext({ flowData: { ...state?.context.flowData, notifiers } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Connect a notifier</h1>
                <p className="text-sm text-muted-foreground mt-1">Optional — get notified about backups, restores and health checks.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
                {notificationProviders
                    .filter((p) => !p.preview)
                    .map((provider) => {
                        const Icon = provider.icon;
                        const isSelected = selected.includes(provider.value);
                        return (
                            <button
                                key={provider.value}
                                type="button"
                                onClick={() => toggle(provider.value)}
                                className={`flex items-center gap-2 rounded-md border p-3 text-sm ${isSelected ? "border-primary bg-primary/10" : "border-white/10"}`}
                            >
                                <Icon className="size-4" />
                                {provider.label}
                            </button>
                        );
                    })}
            </div>
            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
