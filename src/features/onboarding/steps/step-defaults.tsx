"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  OnboardingChannel,
  OnboardingDefaultsData,
} from "@/features/onboarding/types";
import { getChannelIcon } from "@/features/channel/components/channels-helpers";
import { updateNotificationSettingsAction } from "@/features/settings/actions/notification.action";
import { updateStorageSettingsAction } from "@/features/settings/actions/storage.action";

export const StepDefaults = () => {
  const { next, updateContext, state } = useOnboarding();
  const notifiers = (state?.context.flowData.notifiers ??
    []) as OnboardingChannel[];
  const storages = (state?.context.flowData.storages ??
    []) as OnboardingChannel[];
  const existingDefaults = (state?.context.flowData.defaults ??
    {}) as OnboardingDefaultsData;

  const [notifierId, setNotifierId] = useState<string | undefined>(
    existingDefaults.notifierId || undefined,
  );
  const [storageId, setStorageId] = useState<string | undefined>(
    existingDefaults.storageId || undefined,
  );

  const selectNotifier = async (value: string) => {
    const prev = notifierId;
    setNotifierId(value);
    try {
      await updateNotificationSettingsAction({
        name: "system",
        data: { notificationChannelId: value },
      });
      await updateContext({
        flowData: {
          ...state?.context.flowData,
          defaults: { notifierId: value, storageId },
        },
      });
    } catch {
      setNotifierId(prev);
      toast.error("Failed to save default notifier");
    }
  };

  const selectStorage = async (value: string) => {
    const prev = storageId;
    setStorageId(value);
    try {
      await updateStorageSettingsAction({
        name: "system",
        data: { storageChannelId: value, encryption: false },
      });
      await updateContext({
        flowData: {
          ...state?.context.flowData,
          defaults: { notifierId, storageId: value },
        },
      });
    } catch {
      setStorageId(prev);
      toast.error("Failed to save default storage");
    }
  };

  const onContinue = async () => {
    await updateContext({
      flowData: {
        ...state?.context.flowData,
        defaults: { notifierId, storageId },
      },
    });
    await next();
  };

  const selectedNotifier = notifiers.find((n) => n.id === notifierId);
  const selectedStorage = storages.find((s) => s.id === storageId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Set your defaults</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — choose the default notifier and storage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Default notifier</Label>
          <Select
            value={selectedNotifier ? notifierId : undefined}
            onValueChange={selectNotifier}
            disabled={notifiers.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  notifiers.length === 0
                    ? "No notifier connected"
                    : "Choose a notifier"
                }
              >
                {selectedNotifier && (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-muted-foreground scale-90 shrink-0">
                      {getChannelIcon(selectedNotifier.provider)}
                    </div>
                    <span className="truncate font-medium">
                      {selectedNotifier.name}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {notifiers.map((n) => (
                <SelectItem key={n.id} value={n.id}>
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div className="text-muted-foreground scale-90 shrink-0">
                      {getChannelIcon(n.provider)}
                    </div>
                    <span className="font-medium truncate min-w-0">
                      {n.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 capitalize shrink-0">
                      ({n.provider})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Default storage</Label>
          <Select
            value={selectedStorage ? storageId : undefined}
            onValueChange={selectStorage}
            disabled={storages.length === 0}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  storages.length === 0
                    ? "No storage connected"
                    : "Choose a storage"
                }
              >
                {selectedStorage && (
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-muted-foreground scale-90 shrink-0">
                      {getChannelIcon(selectedStorage.provider)}
                    </div>
                    <span className="truncate font-medium">
                      {selectedStorage.name}
                    </span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {storages.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2 w-full min-w-0">
                    <div className="text-muted-foreground scale-90 shrink-0">
                      {getChannelIcon(s.provider)}
                    </div>
                    <span className="font-medium truncate min-w-0">
                      {s.name}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2 capitalize shrink-0">
                      ({s.provider})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="button" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
};
