"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  Database,
  Bell,
  HardDrive,
  Shield,
  Clock,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { MultiSelect } from "@/components/common/multi-select";
import { BackupScheduleSelector } from "@/features/onboarding/utils/backup-schedule-selector";
import type { BackupScheduleValue } from "@/features/onboarding/utils/backup-schedule-selector";
import { applyOnboardingDbSettingsAction } from "@/features/onboarding/actions/apply-db-settings.action";
import { EVENT_KIND_OPTIONS } from "@/features/database/channels-policy.schema";
import { getChannelIcon } from "@/features/channel/channels-helpers";
import type {
  OnboardingChannel,
  OnboardingDatabase,
  OnboardingDbSettings,
  OnboardingNotificationPolicy,
  OnboardingProjectData,
  OnboardingStoragePolicy,
} from "@/features/onboarding/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionKind = "retention" | "scheduling" | "notifications" | "storage";

type Phase =
  | { kind: "grid" }
  | { kind: "db"; dbId: string }
  | { kind: "section"; dbId: string; section: SectionKind };

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_RETENTION: OnboardingDbSettings["retention"] = {
  type: "gfs",
  count: 7,
  days: 30,
  gfs: { daily: 7, weekly: 4, monthly: 12, yearly: 3 },
};

const DEFAULT_SCHEDULE: BackupScheduleValue = {
  method: "automatic",
  cron: "0 0 * * *",
};

// ─── Section: Retention ───────────────────────────────────────────────────────

type RetentionSectionProps = {
  initial: OnboardingDbSettings["retention"];
  onSave: (value: NonNullable<OnboardingDbSettings["retention"]>) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
};

const RetentionSection = ({
  initial,
  onSave,
  onBack,
  isPending,
}: RetentionSectionProps) => {
  const [settings, setSettings] = useState<NonNullable<OnboardingDbSettings["retention"]>>(
    initial ?? DEFAULT_RETENTION
  );

  const totalFiles = () => {
    if (settings.type === "gfs") {
      return settings.gfs.daily + settings.gfs.weekly + settings.gfs.monthly + settings.gfs.yearly;
    }
    return settings.type === "count" ? settings.count : settings.days;
  };

  const storageEstimate = () => {
    const t = totalFiles();
    if (t <= 10) return "Low";
    if (t <= 30) return "Medium";
    return "High";
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-4">
        <Label className="text-sm font-medium">Retention Policy Type</Label>
        <RadioGroup
          value={settings.type ?? ""}
          onValueChange={(v) =>
            setSettings((prev) => ({
              ...prev,
              type: v as "count" | "days" | "gfs",
            }))
          }
          className="grid grid-cols-1 gap-4"
        >
          {[
            {
              id: "count",
              label: "Keep last N backups",
              desc: "Simple count-based retention (e.g., keep last 10 backups)",
            },
            {
              id: "days",
              label: "Keep backups for X days",
              desc: "Time-based retention (e.g., keep backups for 30 days)",
            },
            {
              id: "gfs",
              label: "GFS Rotation",
              desc: "Grandfather-Father-Son rotation for enterprise/critical systems",
              badge: "Recommended",
            },
          ].map((opt) => (
            <Label
              key={opt.id}
              htmlFor={opt.id}
              className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer ${
                settings.type === opt.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              <RadioGroupItem value={opt.id} id={opt.id} />
              <div className="flex-1">
                <span className="font-medium flex items-center gap-2">
                  {opt.label}
                  {opt.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {opt.badge}
                    </Badge>
                  )}
                </span>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {settings.type && <Separator />}

      {settings.type === "count" && (
        <div className="space-y-2">
          <Label htmlFor="backup-count">Number of backups to keep</Label>
          <Input
            id="backup-count"
            type="number"
            min={1}
            max={100}
            className="w-32"
            value={settings.count}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                count: parseInt(e.target.value) || 1,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Older backups beyond this count will be automatically deleted.
          </p>
        </div>
      )}

      {settings.type === "days" && (
        <div className="space-y-2">
          <Label htmlFor="retention-days">Retention period (days)</Label>
          <Input
            id="retention-days"
            type="number"
            min={1}
            max={3650}
            className="w-32"
            value={settings.days}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                days: parseInt(e.target.value) || 1,
              }))
            }
          />
          <p className="text-xs text-muted-foreground">
            Backups older than {settings.days} days will be automatically deleted.
          </p>
        </div>
      )}

      {settings.type === "gfs" && (
        <div className="grid grid-cols-2 gap-4">
          {(
            [
              { key: "daily",   label: "Daily backups",   min: 1, max: 31  },
              { key: "weekly",  label: "Weekly backups",  min: 0, max: 52  },
              { key: "monthly", label: "Monthly backups", min: 0, max: 120 },
              { key: "yearly",  label: "Yearly backups",  min: 0, max: 50  },
            ] as const
          ).map(({ key, label, min, max }) => (
            <div key={key} className="space-y-2">
              <Label>{label}</Label>
              <Input
                type="number"
                min={min}
                max={max}
                value={settings.gfs[key]}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    gfs: { ...prev.gfs, [key]: parseInt(e.target.value) || 0 },
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">Keep N {key} backups</p>
            </div>
          ))}
        </div>
      )}

      {settings.type && (
        <>
          <Separator />
          <div className="rounded-lg border p-4 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Storage Impact</span>
              <Badge
                variant={
                  storageEstimate() === "Low"
                    ? "default"
                    : storageEstimate() === "Medium"
                    ? "secondary"
                    : "destructive"
                }
              >
                {storageEstimate()} Usage
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              ~{totalFiles()} backup files per database
            </p>
          </div>
        </>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button
          type="button"
          disabled={!settings.type || isPending}
          onClick={() => onSave(settings)}
          className="ml-auto"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};

// ─── Section: Scheduling ──────────────────────────────────────────────────────

type SchedulingSectionProps = {
  initial: Pick<OnboardingDbSettings, "backupMethod" | "backupCron">;
  onSave: (method: "manual" | "automatic", cron?: string) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
};

const SchedulingSection = ({
  initial,
  onSave,
  onBack,
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
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
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

// ─── Section: Notifications ───────────────────────────────────────────────────

type NotificationsSectionProps = {
  initial: OnboardingNotificationPolicy[];
  notifiers: OnboardingChannel[];
  onSave: (policies: OnboardingNotificationPolicy[]) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
};

const NotificationsSection = ({
  initial,
  notifiers,
  onSave,
  onBack,
  isPending,
}: NotificationsSectionProps) => {
  const [policies, setPolicies] = useState<OnboardingNotificationPolicy[]>(initial);

  const addPolicy = () =>
    setPolicies((prev) => [...prev, { channelId: "", eventKinds: [], enabled: true }]);

  const removePolicy = (index: number) =>
    setPolicies((prev) => prev.filter((_, i) => i !== index));

  const updatePolicy = (
    index: number,
    patch: Partial<OnboardingNotificationPolicy>
  ) =>
    setPolicies((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );

  const selectedChannelIds = policies.map((p) => p.channelId).filter(Boolean);

  if (notifiers.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
          <Bell className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium text-sm">No notifiers configured</p>
          <p className="text-xs text-muted-foreground">
            Go back and configure notifiers in the &quot;Connect a notifier&quot; step first.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Notification Policies</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={policies.length >= notifiers.length}
          onClick={addPolicy}
        >
          <Plus className="size-4 mr-1" />
          Add Policy
        </Button>
      </div>

      {policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-muted/20 text-center gap-1">
          <p className="text-sm text-muted-foreground">
            Click &quot;Add Policy&quot; to start receiving notifications.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {policies.map((policy, index) => {
            const available = notifiers.filter(
              (n) =>
                n.id === policy.channelId ||
                !selectedChannelIds.includes(n.id)
            );
            const selected = notifiers.find((n) => n.id === policy.channelId);

            return (
              <Card key={policy.channelId || index} className="p-4 flex flex-col gap-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1 flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Channel
                    </Label>
                    <Select
                      value={policy.channelId}
                      onValueChange={(v) => updatePolicy(index, { channelId: v })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select channel">
                          {selected && (
                            <div className="flex items-center gap-2">
                              {getChannelIcon(selected.provider)}
                              <span className="truncate font-medium text-sm">
                                {selected.name}
                              </span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {available.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            <div className="flex items-center gap-2">
                              {getChannelIcon(n.provider)}
                              <span>{n.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Status
                    </Label>
                    <div className="flex items-center h-9 px-3 rounded-md border border-input bg-background gap-2">
                      <Label className="text-xs cursor-pointer">
                        {policy.enabled ? "Active" : "Off"}
                      </Label>
                      <Switch
                        checked={policy.enabled}
                        onCheckedChange={(v) => updatePolicy(index, { enabled: v })}
                        className="scale-75 origin-right"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive/50 shrink-0"
                    onClick={() => removePolicy(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Trigger Events
                  </Label>
                  <MultiSelect
                    options={EVENT_KIND_OPTIONS}
                    onValueChange={(v) => updatePolicy(index, { eventKinds: v })}
                    defaultValue={policy.eventKinds}
                    placeholder="Select events…"
                    variant="inverted"
                    animation={0}
                    className="bg-background/50 w-full"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button
          type="button"
          disabled={isPending || policies.some((p) => !p.channelId || p.eventKinds.length === 0)}
          onClick={() => onSave(policies)}
          className="ml-auto"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};

// ─── Section: Storage ─────────────────────────────────────────────────────────

type StorageSectionProps = {
  initial: OnboardingStoragePolicy[];
  storages: OnboardingChannel[];
  onSave: (policies: OnboardingStoragePolicy[]) => Promise<void>;
  onBack: () => void;
  isPending: boolean;
};

const StorageSection = ({
  initial,
  storages,
  onSave,
  onBack,
  isPending,
}: StorageSectionProps) => {
  const [policies, setPolicies] = useState<OnboardingStoragePolicy[]>(initial);

  const addPolicy = () =>
    setPolicies((prev) => [...prev, { channelId: "", enabled: true }]);

  const removePolicy = (index: number) =>
    setPolicies((prev) => prev.filter((_, i) => i !== index));

  const updatePolicy = (
    index: number,
    patch: Partial<OnboardingStoragePolicy>
  ) =>
    setPolicies((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );

  const selectedChannelIds = policies.map((p) => p.channelId).filter(Boolean);

  if (storages.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-2">
          <HardDrive className="h-8 w-8 text-muted-foreground/50" />
          <p className="font-medium text-sm">No storages configured</p>
          <p className="text-xs text-muted-foreground">
            Go back and configure storages in the &quot;Connect a storage&quot; step first.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Storage Policies</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={policies.length >= storages.length}
          onClick={addPolicy}
        >
          <Plus className="size-4 mr-1" />
          Add Policy
        </Button>
      </div>

      {policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed rounded-xl bg-muted/20 text-center gap-1">
          <p className="text-sm text-muted-foreground">
            Click &quot;Add Policy&quot; to assign a storage to this database.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {policies.map((policy, index) => {
            const available = storages.filter(
              (s) =>
                s.id === policy.channelId ||
                !selectedChannelIds.includes(s.id)
            );
            const selected = storages.find((s) => s.id === policy.channelId);

            return (
              <Card key={policy.channelId || index} className="p-4 flex items-end gap-2">
                <div className="flex-1 flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Storage Channel
                  </Label>
                  <Select
                    value={policy.channelId}
                    onValueChange={(v) => updatePolicy(index, { channelId: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select storage">
                        {selected && (
                          <div className="flex items-center gap-2">
                            {getChannelIcon(selected.provider)}
                            <span className="truncate font-medium text-sm">
                              {selected.name}
                            </span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {available.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <div className="flex items-center gap-2">
                            {getChannelIcon(s.provider)}
                            <span>{s.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Status
                  </Label>
                  <div className="flex items-center h-9 px-3 rounded-md border border-input bg-background gap-2">
                    <Label className="text-xs cursor-pointer">
                      {policy.enabled ? "Active" : "Off"}
                    </Label>
                    <Switch
                      checked={policy.enabled}
                      onCheckedChange={(v) => updatePolicy(index, { enabled: v })}
                      className="scale-75 origin-right"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground hover:text-destructive hover:border-destructive/50 shrink-0"
                  onClick={() => removePolicy(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft className="size-4 mr-1" />
          Back
        </Button>
        <Button
          type="button"
          disabled={isPending || policies.some((p) => !p.channelId)}
          onClick={() => onSave(policies)}
          className="ml-auto"
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const StepDbSettings = () => {
  const { next, updateContext, state } = useOnboarding();

  const project = (state?.context.flowData.project ?? {
    databaseIds: [],
  }) as OnboardingProjectData;
  const databases = (state?.context.flowData.databases ?? []) as OnboardingDatabase[];
  const notifiers = (state?.context.flowData.notifiers ?? []) as OnboardingChannel[];
  const storages = (state?.context.flowData.storages ?? []) as OnboardingChannel[];
  const dbSettings = (
    state?.context.flowData.dbSettings ?? {}
  ) as Record<string, OnboardingDbSettings>;

  const databaseIds = project.databaseIds;
  const [phase, setPhase] = useState<Phase>({ kind: "grid" });

  const applyMutation = useMutation({
    mutationFn: (args: Parameters<typeof applyOnboardingDbSettingsAction>[0]) =>
      applyOnboardingDbSettingsAction(args),
    onError: () => toast.error("Failed to save settings."),
  });

  if (!databaseIds || databaseIds.length === 0) return null;

  const getDb = (dbId: string) => databases.find((d) => d.id === dbId);

  const isDbConfigured = (dbId: string) => {
    const s = dbSettings[dbId];
    return !!(
      s &&
      (s.retention ||
        s.backupMethod !== undefined ||
        s.notificationPolicies !== undefined ||
        s.storagePolicies !== undefined)
    );
  };

  const isSectionConfigured = (dbId: string, section: SectionKind) => {
    const s = dbSettings[dbId];
    if (!s) return false;
    switch (section) {
      case "retention":      return !!s.retention;
      case "scheduling":     return s.backupMethod !== undefined;
      case "notifications":  return s.notificationPolicies !== undefined;
      case "storage":        return s.storagePolicies !== undefined;
    }
  };

  const updateDbSettings = async (
    dbId: string,
    patch: Partial<OnboardingDbSettings>
  ) => {
    const updated = {
      ...dbSettings,
      [dbId]: { ...(dbSettings[dbId] ?? {}), ...patch },
    };
    await updateContext({ flowData: { ...state?.context.flowData, dbSettings: updated } });
  };

  // ── Phase: grid ────────────────────────────────────────────────────────────

  if (phase.kind === "grid") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Configure databases</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Optional — configure backup policies for each database.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {databaseIds.map((dbId) => {
            const db = getDb(dbId);
            const configured = isDbConfigured(dbId);
            return (
              <button
                key={dbId}
                type="button"
                onClick={() => setPhase({ kind: "db", dbId })}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-all text-left hover:bg-accent/50 hover:border-primary/20"
              >
                <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                  <Database className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-0.5 flex-1">
                  <span className="font-medium">{db?.name ?? dbId}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {db?.engine}
                  </span>
                </div>
                {configured && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <Check className="size-3 mr-1" />
                    Configured
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <Button type="button" onClick={() => next()}>
          Continue
        </Button>
      </div>
    );
  }

  // ── Phase: db ──────────────────────────────────────────────────────────────

  if (phase.kind === "db") {
    const { dbId } = phase;
    const db = getDb(dbId);
    const settings = dbSettings[dbId] ?? {};

    const configuredCount = (
      ["retention", "scheduling", "notifications", "storage"] as SectionKind[]
    ).filter((s) => isSectionConfigured(dbId, s)).length;

    const hasAnyConfigured = configuredCount > 0;

    const handleApplyToAll = async () => {
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
        } catch {
          // mutation onError already shows a toast
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
        toast.warning(`Settings applied to ${succeededIds.length} of ${otherDbIds.length} databases.`);
        setPhase({ kind: "grid" });
      }
    };

    const SECTIONS: {
      kind: SectionKind;
      label: string;
      icon: React.ReactNode;
    }[] = [
      { kind: "retention",     label: "Retention Policy", icon: <Shield className="size-4 text-muted-foreground" /> },
      { kind: "scheduling",    label: "Scheduling",        icon: <Clock  className="size-4 text-muted-foreground" /> },
      { kind: "notifications", label: "Notifications",     icon: <Bell   className="size-4 text-muted-foreground" /> },
      { kind: "storage",       label: "Storage",           icon: <HardDrive className="size-4 text-muted-foreground" /> },
    ];

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
          <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
            <Database className="size-4" />
          </div>
          <p className="flex-1 text-sm font-medium capitalize">
            {db?.name ?? dbId}{" "}
            <span className="text-muted-foreground font-normal">({db?.engine})</span>
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPhase({ kind: "grid" })}
          >
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {SECTIONS.map(({ kind, label, icon }) => {
            const configured = isSectionConfigured(dbId, kind);
            return (
              <button
                key={kind}
                type="button"
                onClick={() => setPhase({ kind: "section", dbId, section: kind })}
                className="flex items-center gap-3 rounded-lg border p-3 text-sm transition-all text-left hover:bg-accent/50 hover:border-primary/20"
              >
                <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <span className="flex-1 font-medium">{label}</span>
                {configured && (
                  <div className="size-5 rounded-full bg-primary flex items-center justify-center ml-auto shrink-0">
                    <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {databaseIds.length > 1 && hasAnyConfigured && (
          <Button
            type="button"
            variant="outline"
            disabled={applyMutation.isPending}
            onClick={handleApplyToAll}
          >
            <Copy className="size-4 mr-2" />
            {applyMutation.isPending
              ? "Applying…"
              : "Apply to all databases"}
          </Button>
        )}
      </div>
    );
  }

  // ── Phase: section ─────────────────────────────────────────────────────────

  if (phase.kind === "section") {
    const { dbId, section } = phase;
    const db = getDb(dbId);
    const settings = dbSettings[dbId] ?? {};

    const sectionLabels: Record<SectionKind, string> = {
      retention:     "Retention Policy",
      scheduling:    "Scheduling",
      notifications: "Notifications",
      storage:       "Storage",
    };

    const back = () => setPhase({ kind: "db", dbId });

    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border">
          <p className="flex-1 text-sm font-medium">
            {sectionLabels[section]}{" "}
            <span className="text-muted-foreground font-normal">
              — {db?.name ?? dbId}
            </span>
          </p>
          <Button type="button" variant="ghost" size="sm" onClick={back}>
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
        </div>

        {section === "retention" && (
          <RetentionSection
            initial={settings.retention}
            isPending={applyMutation.isPending}
            onBack={back}
            onSave={async (retention) => {
              await applyMutation.mutateAsync({
                databaseId: dbId,
                section: "retention",
                retention,
              });
              await updateDbSettings(dbId, { retention });
              toast.success("Retention policy saved.");
              setPhase({ kind: "db", dbId });
            }}
          />
        )}

        {section === "scheduling" && (
          <SchedulingSection
            initial={{ backupMethod: settings.backupMethod, backupCron: settings.backupCron }}
            isPending={applyMutation.isPending}
            onBack={back}
            onSave={async (backupMethod, backupCron) => {
              await applyMutation.mutateAsync({
                databaseId: dbId,
                section: "scheduling",
                backupMethod,
                backupCron,
              });
              await updateDbSettings(dbId, { backupMethod, backupCron });
              toast.success("Schedule saved.");
              setPhase({ kind: "db", dbId });
            }}
          />
        )}

        {section === "notifications" && (
          <NotificationsSection
            initial={settings.notificationPolicies ?? []}
            notifiers={notifiers}
            isPending={applyMutation.isPending}
            onBack={back}
            onSave={async (notificationPolicies) => {
              await applyMutation.mutateAsync({
                databaseId: dbId,
                section: "notifications",
                notificationPolicies: notificationPolicies as any,
              });
              await updateDbSettings(dbId, { notificationPolicies });
              toast.success("Notification policies saved.");
              setPhase({ kind: "db", dbId });
            }}
          />
        )}

        {section === "storage" && (
          <StorageSection
            initial={settings.storagePolicies ?? []}
            storages={storages}
            isPending={applyMutation.isPending}
            onBack={back}
            onSave={async (storagePolicies) => {
              await applyMutation.mutateAsync({
                databaseId: dbId,
                section: "storage",
                storagePolicies,
              });
              await updateDbSettings(dbId, { storagePolicies });
              toast.success("Storage policies saved.");
              setPhase({ kind: "db", dbId });
            }}
          />
        )}
      </div>
    );
  }

  return null;
};
