"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { OnboardingDbSettings, OnboardingProjectData } from "@/features/onboarding/onboarding.types";

export const StepDbSettings = () => {
    const { next, updateContext, state } = useOnboarding();
    const project = (state?.context.flowData.project ?? { databaseIds: [] }) as OnboardingProjectData;
    const databaseIds = project.databaseIds;
    const [index, setIndex] = useState(0);
    const [applyToAll, setApplyToAll] = useState(false);
    const [retentionDays, setRetentionDays] = useState(30);
    const [settings, setSettings] = useState<Record<string, OnboardingDbSettings>>({});

    if (databaseIds.length === 0) {
        return (
            <div className="flex flex-col gap-4">
                <h1 className="text-2xl font-semibold">No database to configure</h1>
                <Button type="button" onClick={() => next()}>
                    Continue
                </Button>
            </div>
        );
    }

    const currentDbId = databaseIds[index];
    // Database info is available from state flowData if needed
    // For now, just use the ID

    const saveCurrent = (): Record<string, OnboardingDbSettings> => {
        if (applyToAll) {
            const allSettings: Record<string, OnboardingDbSettings> = {};
            databaseIds.forEach((id) => {
                allSettings[id] = { retentionDays };
            });
            return allSettings;
        }
        return { ...settings, [currentDbId]: { retentionDays } };
    };

    const onContinue = async () => {
        const updated = saveCurrent();
        setSettings(updated);

        if (applyToAll || index === databaseIds.length - 1) {
            await updateContext({ flowData: { ...state?.context.flowData, dbSettings: updated } });
            await next();
            return;
        }

        setIndex((prev) => prev + 1);
        setRetentionDays(30);
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Configure database</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Database {index + 1} of {databaseIds.length}
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <Label htmlFor="retention">Retention (days)</Label>
                <Input
                    id="retention"
                    type="number"
                    value={retentionDays}
                    onChange={(e) => setRetentionDays(Number(e.target.value))}
                />
            </div>
            {databaseIds.length > 1 && (
                <div className="flex items-center gap-2">
                    <Switch checked={applyToAll} onCheckedChange={setApplyToAll} id="apply-all" />
                    <Label htmlFor="apply-all">Apply to all databases</Label>
                </div>
            )}
            <Button type="button" onClick={onContinue}>
                {applyToAll || index === databaseIds.length - 1 ? "Continue" : "Next database"}
            </Button>
        </div>
    );
};
