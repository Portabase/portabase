"use client";

import { useState, useEffect, useRef } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OnboardingChannel, OnboardingDefaultsData } from "@/features/onboarding/types";
import { updateNotificationSettingsAction } from "@/features/settings/notification.action";
import { updateStorageSettingsAction } from "@/features/settings/storage.action";

export const StepDefaults = () => {
    const { next, updateContext, state } = useOnboarding();
    const notifiers = (state?.context.flowData.notifiers ?? []) as OnboardingChannel[];
    const storages = (state?.context.flowData.storages ?? []) as OnboardingChannel[];
    const existingDefaults = (state?.context.flowData.defaults ?? {}) as OnboardingDefaultsData;
    const [notifierId, setNotifierId] = useState<string | undefined>(existingDefaults.notifierId);
    const [storageId, setStorageId] = useState<string | undefined>(existingDefaults.storageId);

    const skipped = useRef(false);
    useEffect(() => {
        if (!skipped.current && notifiers.length === 0 && storages.length === 0) {
            skipped.current = true;
            next();
        }
    }, []);

    const selectNotifier = async (value: string) => {
        setNotifierId(value);
        await updateNotificationSettingsAction({ name: "system", data: { notificationChannelId: value } });
        await updateContext({ flowData: { ...state?.context.flowData, defaults: { notifierId: value, storageId } } });
    };

    const selectStorage = async (value: string) => {
        setStorageId(value);
        await updateStorageSettingsAction({ name: "system", data: { storageChannelId: value, encryption: false } });
        await updateContext({ flowData: { ...state?.context.flowData, defaults: { notifierId, storageId: value } } });
    };

    const onContinue = async () => {
        await updateContext({ flowData: { ...state?.context.flowData, defaults: { notifierId, storageId } } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Set your defaults</h1>
                <p className="text-sm text-muted-foreground mt-1">Optional — choose the default notifier and storage for new agents.</p>
            </div>
            <div className="flex flex-col gap-2">
                <Label>Default notifier</Label>
                <Select value={notifierId} onValueChange={selectNotifier} disabled={notifiers.length === 0}>
                    <SelectTrigger>
                        <SelectValue placeholder={notifiers.length === 0 ? "No notifier connected" : "Choose a notifier"} />
                    </SelectTrigger>
                    <SelectContent>
                        {notifiers.map((n) => (
                            <SelectItem key={n.id} value={n.id}>
                                {n.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-2">
                <Label>Default storage</Label>
                <Select value={storageId} onValueChange={selectStorage} disabled={storages.length === 0}>
                    <SelectTrigger>
                        <SelectValue placeholder={storages.length === 0 ? "No storage connected" : "Choose a storage"} />
                    </SelectTrigger>
                    <SelectContent>
                        {storages.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button type="button" onClick={onContinue}>
                Continue
            </Button>
        </div>
    );
};
