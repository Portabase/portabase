"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { DbGrid } from "@/features/onboarding/components/db-settings/db-grid";
import { DbDetail } from "@/features/onboarding/components/db-settings/db-detail";
import { DbSection } from "@/features/onboarding/components/db-settings/db-section";
import { useApplyDbSettings } from "@/features/onboarding/hooks/use-apply-db-settings";
import type {
  OnboardingChannel,
  OnboardingDatabase,
  OnboardingDbSettings,
  OnboardingProjectData,
  SectionKind,
} from "@/features/onboarding/types";

type Phase =
  | { kind: "grid" }
  | { kind: "db"; dbId: string }
  | { kind: "section"; dbId: string; section: SectionKind };

export const StepDbSettings = () => {
  const { next, updateContext, state } = useOnboarding();
  const [phase, setPhase] = useState<Phase>({ kind: "grid" });

  const project = (state?.context.flowData.project ?? {
    databaseIds: [],
  }) as OnboardingProjectData;
  const databases = (state?.context.flowData.databases ??
    []) as OnboardingDatabase[];
  const notifiers = (state?.context.flowData.notifiers ??
    []) as OnboardingChannel[];
  const storages = (state?.context.flowData.storages ??
    []) as OnboardingChannel[];
  const dbSettings = (state?.context.flowData.dbSettings ?? {}) as Record<
    string,
    OnboardingDbSettings
  >;

  const databaseIds = project.databaseIds;
  const applyMutation = useApplyDbSettings();

  if (!databaseIds || databaseIds.length === 0) return null;

  const getDb = (id: string) => databases.find((d) => d.id === id);

  const isSectionConfigured = (dbId: string, section: SectionKind): boolean => {
    const s = dbSettings[dbId];
    if (!s) return false;
    switch (section) {
      case "retention":
        return !!s.retention;
      case "scheduling":
        return s.backupMethod === "automatic";
      case "notifications":
        return (s.notificationPolicies?.length ?? 0) > 0;
      case "storage":
        return (s.storagePolicies?.length ?? 0) > 0;
    }
  };

  const SECTION_KINDS: SectionKind[] = [
    "retention",
    "scheduling",
    "notifications",
    "storage",
  ];

  const isDbConfigured = (dbId: string) =>
    SECTION_KINDS.some((k) => isSectionConfigured(dbId, k));

  const updateDbSettings = async (
    dbId: string,
    patch: Partial<OnboardingDbSettings>,
  ) => {
    const updated = {
      ...dbSettings,
      [dbId]: { ...(dbSettings[dbId] ?? {}), ...patch },
    };
    await updateContext({
      flowData: { ...state?.context.flowData, dbSettings: updated },
    });
  };

  const handleApplyToAll = async (dbId: string) => {
    const settings = dbSettings[dbId] ?? {};
    const otherDbIds = databaseIds.filter((id) => id !== dbId);
    const succeededIds: string[] = [];

    for (const targetId of otherDbIds) {
      try {
        await applyMutation.mutateAsync({
          databaseId: targetId,
          section: "all",
          retention: settings.retention,
          backupMethod: settings.backupMethod,
          backupCron: settings.backupCron,
          notificationPolicies: settings.notificationPolicies,
          storagePolicies: settings.storagePolicies,
        });
        succeededIds.push(targetId);
      } catch (err) {
        console.error("Failed to apply settings to database", targetId, err);
      }
    }

    if (succeededIds.length > 0) {
      const updatedSettings = { ...dbSettings };
      succeededIds.forEach((id) => {
        updatedSettings[id] = { ...(dbSettings[id] ?? {}), ...settings };
      });
      await updateContext({
        flowData: { ...state?.context.flowData, dbSettings: updatedSettings },
      });
    }

    if (succeededIds.length === otherDbIds.length) {
      toast.success("Settings applied to all databases.");
      setPhase({ kind: "grid" });
    } else if (succeededIds.length > 0) {
      toast.warning(
        `Settings applied to ${succeededIds.length} of ${otherDbIds.length} databases.`,
      );
      setPhase({ kind: "grid" });
    }
  };

  if (phase.kind === "grid")
    return (
      <DbGrid
        databaseIds={databaseIds}
        getDb={getDb}
        isDbConfigured={isDbConfigured}
        onSelectDb={(dbId) => setPhase({ kind: "db", dbId })}
        onContinue={() => next()}
      />
    );

  if (phase.kind === "db") {
    const { dbId } = phase;
    return (
      <DbDetail
        dbId={dbId}
        db={getDb(dbId)}
        isSectionConfigured={(s) => isSectionConfigured(dbId, s)}
        isMultiDb={databaseIds.length > 1}
        hasAnyConfigured={SECTION_KINDS.some((k) =>
          isSectionConfigured(dbId, k),
        )}
        isApplyingToAll={applyMutation.isPending}
        onSelectSection={(section) =>
          setPhase({ kind: "section", dbId, section })
        }
        onApplyToAll={() => handleApplyToAll(dbId)}
        onBack={() => setPhase({ kind: "grid" })}
      />
    );
  }

  if (phase.kind === "section") {
    const { dbId, section } = phase;
    return (
      <DbSection
        dbId={dbId}
        db={getDb(dbId)}
        section={section}
        settings={dbSettings[dbId] ?? {}}
        applyMutation={applyMutation}
        notifiers={notifiers}
        storages={storages}
        updateDbSettings={updateDbSettings}
        onBack={() => setPhase({ kind: "db", dbId })}
        onSaved={() => setPhase({ kind: "db", dbId })}
      />
    );
  }

  return null;
};
