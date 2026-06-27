"use client";

import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RetentionSection } from "@/features/onboarding/components/db-settings/retention-section";
import { SchedulingSection } from "@/features/onboarding/components/db-settings/scheduling-section";
import { NotificationsSection } from "@/features/onboarding/components/db-settings/notifications-section";
import { StorageSection } from "@/features/onboarding/components/db-settings/storage-section";
import type {
  OnboardingChannel,
  OnboardingDatabase,
  OnboardingDbSettings,
  SectionKind,
} from "@/features/onboarding/types";
import type { useApplyDbSettings } from "@/features/onboarding/hooks/use-apply-db-settings";

const SECTION_LABELS: Record<SectionKind, string> = {
  retention: "Retention Policy",
  scheduling: "Scheduling",
  notifications: "Notifications",
  storage: "Storage",
};

type DbSectionProps = {
  dbId: string;
  db: OnboardingDatabase | undefined;
  section: SectionKind;
  settings: OnboardingDbSettings;
  applyMutation: ReturnType<typeof useApplyDbSettings>;
  notifiers: OnboardingChannel[];
  storages: OnboardingChannel[];
  onBack: () => void;
  onSaved: () => void;
  updateDbSettings: (
    dbId: string,
    patch: Partial<OnboardingDbSettings>,
  ) => Promise<void>;
};

export const DbSection = ({
  dbId,
  db,
  section,
  settings,
  applyMutation,
  notifiers,
  storages,
  onBack,
  onSaved,
  updateDbSettings,
}: DbSectionProps) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
      <p className="flex-1 text-sm font-medium">
        {SECTION_LABELS[section]}{" "}
        <span className="text-muted-foreground font-normal">
          — {db?.name ?? dbId}
        </span>
      </p>
      <Button type="button" variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="size-4 mr-1" />
        Back
      </Button>
    </div>

    {section === "retention" && (
      <RetentionSection
        initial={settings.retention}
        isPending={applyMutation.isPending}
        onSave={async (retention) => {
          await applyMutation.mutateAsync({
            databaseId: dbId,
            section: "retention",
            retention,
          });
          await updateDbSettings(dbId, { retention });
          toast.success("Retention policy saved.");
          onSaved();
        }}
      />
    )}

    {section === "scheduling" && (
      <SchedulingSection
        initial={{
          backupMethod: settings.backupMethod,
          backupCron: settings.backupCron,
        }}
        isPending={applyMutation.isPending}
        onSave={async (backupMethod, backupCron) => {
          await applyMutation.mutateAsync({
            databaseId: dbId,
            section: "scheduling",
            backupMethod,
            backupCron,
          });
          await updateDbSettings(dbId, { backupMethod, backupCron });
          toast.success("Schedule saved.");
          onSaved();
        }}
      />
    )}

    {section === "notifications" && (
      <NotificationsSection
        initial={settings.notificationPolicies ?? []}
        notifiers={notifiers}
        isPending={applyMutation.isPending}
        onSave={async (notificationPolicies) => {
          await applyMutation.mutateAsync({
            databaseId: dbId,
            section: "notifications",
            notificationPolicies,
          });
          await updateDbSettings(dbId, { notificationPolicies });
          toast.success("Notification policies saved.");
          onSaved();
        }}
      />
    )}

    {section === "storage" && (
      <StorageSection
        initial={settings.storagePolicies ?? []}
        storages={storages}
        isPending={applyMutation.isPending}
        onSave={async (storagePolicies) => {
          await applyMutation.mutateAsync({
            databaseId: dbId,
            section: "storage",
            storagePolicies,
          });
          await updateDbSettings(dbId, { storagePolicies });
          toast.success("Storage policies saved.");
          onSaved();
        }}
      />
    )}
  </div>
);
