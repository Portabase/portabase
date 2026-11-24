"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarClock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fetchChainStartAction, updateBackupPolicyAction, updateFullBackupCronAction } from "@/features/database/actions/cron.action";
import { PolicyScope } from "@/features/database/schemas/policy-scope.schema";
import { cronFiredBetween, describeCron, nextRuns, parseCron, WEEKDAYS } from "@/features/database/utils/cron-schedule";

type Repeat = "hourly" | "daily" | "weekly" | "monthly" | "custom";

type Schedule = { repeat: Repeat; minute: number; hour: number; weekday: number; monthDay: number; custom: string };

const REPEAT_LABELS: Record<Repeat, string> = {
    hourly: "Every hour",
    daily: "Every day",
    weekly: "Every week",
    monthly: "Every month",
    custom: "Custom (cron)",
};

function toSchedule(cron: string, fallback: Schedule): Schedule {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = cron.trim().split(/\s+/);
    const number = (value: string | undefined) => (value !== undefined && /^\d+$/.test(value) ? Number(value) : null);
    const base = { ...fallback, custom: cron };
    if (month !== "*" || number(minute) === null) return { ...base, repeat: "custom" };
    const at = { minute: number(minute)!, hour: number(hour) ?? fallback.hour };
    if (hour === "*" && dayOfMonth === "*" && dayOfWeek === "*") return { ...base, ...at, repeat: "hourly" };
    if (number(hour) === null) return { ...base, repeat: "custom" };
    if (dayOfMonth === "*" && dayOfWeek === "*") return { ...base, ...at, repeat: "daily" };
    if (dayOfMonth === "*" && number(dayOfWeek) !== null) return { ...base, ...at, repeat: "weekly", weekday: number(dayOfWeek)! % 7 };
    if (dayOfWeek === "*" && number(dayOfMonth) !== null) return { ...base, ...at, repeat: "monthly", monthDay: number(dayOfMonth)! };
    return { ...base, repeat: "custom" };
}

function toCron(schedule: Schedule): string {
    const { minute, hour } = schedule;
    switch (schedule.repeat) {
        case "hourly":
            return `${minute} * * * *`;
        case "daily":
            return `${minute} ${hour} * * *`;
        case "weekly":
            return `${minute} ${hour} * * ${schedule.weekday}`;
        case "monthly":
            return `${minute} ${hour} ${schedule.monthDay} * *`;
        default:
            return schedule.custom.trim();
    }
}

const pad = (value: number) => String(value).padStart(2, "0");

const ScheduleFields = ({
    id,
    schedule,
    repeats,
    onChange,
}: {
    id: string;
    schedule: Schedule;
    repeats: Repeat[];
    onChange: (schedule: Schedule) => void;
}) => {
    const set = (patch: Partial<Schedule>) => onChange({ ...schedule, ...patch });
    const customInvalid = schedule.repeat === "custom" && parseCron(schedule.custom) === null;
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                    <Label htmlFor={`${id}-repeat`} className="text-xs text-muted-foreground">Repeat</Label>
                    <Select value={schedule.repeat} onValueChange={(repeat) => set({ repeat: repeat as Repeat, custom: toCron(schedule) })}>
                        <SelectTrigger id={`${id}-repeat`} className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {repeats.map((repeat) => (
                                <SelectItem key={repeat} value={repeat}>{REPEAT_LABELS[repeat]}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {schedule.repeat === "weekly" && (
                    <div className="flex flex-col gap-1">
                        <Label htmlFor={`${id}-weekday`} className="text-xs text-muted-foreground">On</Label>
                        <Select value={String(schedule.weekday)} onValueChange={(weekday) => set({ weekday: Number(weekday) })}>
                            <SelectTrigger id={`${id}-weekday`} className="w-36">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {WEEKDAYS.map((weekday, index) => (
                                    <SelectItem key={weekday} value={String(index)}>{weekday}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {schedule.repeat === "monthly" && (
                    <div className="flex flex-col gap-1">
                        <Label htmlFor={`${id}-day`} className="text-xs text-muted-foreground">Day</Label>
                        <Input
                            id={`${id}-day`}
                            type="number"
                            min={1}
                            max={28}
                            className="w-20"
                            value={schedule.monthDay}
                            onChange={(event) => set({ monthDay: Math.min(28, Math.max(1, Number(event.target.value) || 1)) })}
                        />
                    </div>
                )}
                {schedule.repeat === "hourly" && (
                    <div className="flex flex-col gap-1">
                        <Label htmlFor={`${id}-minute`} className="text-xs text-muted-foreground">At minute</Label>
                        <Input
                            id={`${id}-minute`}
                            type="number"
                            min={0}
                            max={59}
                            className="w-20"
                            value={schedule.minute}
                            onChange={(event) => set({ minute: Math.min(59, Math.max(0, Number(event.target.value) || 0)) })}
                        />
                    </div>
                )}
                {(schedule.repeat === "daily" || schedule.repeat === "weekly" || schedule.repeat === "monthly") && (
                    <div className="flex flex-col gap-1">
                        <Label htmlFor={`${id}-time`} className="text-xs text-muted-foreground">At</Label>
                        <Input
                            id={`${id}-time`}
                            type="time"
                            className="w-28"
                            value={`${pad(schedule.hour)}:${pad(schedule.minute)}`}
                            onChange={(event) => {
                                const [hour, minute] = event.target.value.split(":").map(Number);
                                if (Number.isInteger(hour) && Number.isInteger(minute)) set({ hour, minute });
                            }}
                        />
                    </div>
                )}
                {schedule.repeat === "custom" && (
                    <div className="flex flex-col gap-1">
                        <Label htmlFor={`${id}-cron`} className="text-xs text-muted-foreground">Cron expression</Label>
                        <Input
                            id={`${id}-cron`}
                            className="w-44 font-mono"
                            value={schedule.custom}
                            aria-invalid={customInvalid}
                            onChange={(event) => set({ custom: event.target.value })}
                            placeholder="*/30 * * * *"
                        />
                    </div>
                )}
            </div>
            {customInvalid && <p className="text-sm text-destructive">Use 5 fields: minute hour day-of-month month day-of-week.</p>}
        </div>
    );
};

const formatRun = (run: Date) =>
    run.toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export type PhysicalSchedulePanelProps = {
    scope: PolicyScope;
    databaseId: string;
    backupCron: string | null;
    fullCron: string | null;
    fullEveryDays: number | null;
    queryKey: unknown[];
    onSaved: () => void;
    onDirtyChange: (dirty: boolean) => void;
};

const DEFAULT_BACKUP: Schedule = { repeat: "daily", minute: 0, hour: 3, weekday: 0, monthDay: 1, custom: "0 3 * * *" };
const DEFAULT_FULL: Schedule = { repeat: "weekly", minute: 0, hour: 2, weekday: 0, monthDay: 1, custom: "0 2 * * 0" };

/** Backup schedule of a physical source: when backups run, which ones are full, and a preview of both. */
export const PhysicalSchedulePanel = (props: PhysicalSchedulePanelProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [backupOn, setBackupOn] = useState(props.backupCron !== null);
    const [backup, setBackup] = useState(() => (props.backupCron ? toSchedule(props.backupCron, DEFAULT_BACKUP) : DEFAULT_BACKUP));
    const [fullOn, setFullOn] = useState(props.fullCron !== null);
    const [full, setFull] = useState(() => (props.fullCron ? toSchedule(props.fullCron, DEFAULT_FULL) : DEFAULT_FULL));
    const [saving, setSaving] = useState(false);

    const backupCron = backupOn ? toCron(backup) : null;
    const fullCron = fullOn ? toCron(full) : null;
    const valid = (backupCron === null || parseCron(backupCron) !== null) && (fullCron === null || parseCron(fullCron) !== null);
    const dirty = backupCron !== props.backupCron || fullCron !== props.fullCron;

    useEffect(() => {
        props.onDirtyChange(dirty);
    }, [dirty, props.onDirtyChange]);

    const { data: chainStartedAt } = useQuery({
        queryKey: ["physical-chain-start", props.databaseId],
        queryFn: async () => {
            const result = await fetchChainStartAction(props.databaseId);
            const startedAt = result?.data?.chainStartedAt;
            return startedAt ? new Date(startedAt) : null;
        },
    });

    const chainAgeRule = props.fullEveryDays === null
        ? "the chain reaches the agent's full_every_days (7 days by default)"
        : `the chain is ${props.fullEveryDays} days old`;

    const preview = useMemo(() => {
        const now = new Date();
        if (!valid) return [];
        if (backupCron === null) return [];
        let chainStart = chainStartedAt ?? null;
        let previous = chainStart ?? now;
        return nextRuns(backupCron, now, 6).map((run) => {
            const isFull = chainStart === null
                || (fullCron !== null
                    ? cronFiredBetween(fullCron, previous, run)
                    : props.fullEveryDays !== null && run.getTime() - chainStart.getTime() >= props.fullEveryDays * 86_400_000);
            if (isFull) chainStart = run;
            previous = run;
            return { run, isFull };
        });
    }, [backupCron, fullCron, valid, chainStartedAt, props.fullEveryDays]);
    const nextFullTime = useMemo(() => (fullCron && valid ? nextRuns(fullCron, new Date(), 1)[0] : undefined), [fullCron, valid]);

    const save = async () => {
        setSaving(true);
        try {
            if (backupCron !== props.backupCron) {
                await updateBackupPolicyAction({ scope: props.scope, backupPolicy: backupCron ?? "" });
            }
            if (fullCron !== props.fullCron) {
                await updateFullBackupCronAction({ databaseId: props.databaseId, cron: fullCron ?? "" });
            }
            toast.success("Backup schedule saved.");
            await queryClient.invalidateQueries({ queryKey: props.queryKey });
            router.refresh();
            props.onSaved();
        } catch {
            toast.error("The backup schedule could not be saved.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
                <section className="flex flex-col gap-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="backups-on" className="font-semibold">When backups run</Label>
                        </div>
                        <Switch id="backups-on" checked={backupOn} onCheckedChange={setBackupOn} />
                    </div>
                    <p className="text-sm font-medium">
                        {backupOn && backupCron ? describeCron(backupCron) : "Only when you click Backup"}
                    </p>
                    {backupOn && (
                        <ScheduleFields id="backups" schedule={backup} repeats={["hourly", "daily", "weekly", "custom"]} onChange={setBackup} />
                    )}
                </section>

                <section className="flex flex-col gap-3 rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                            <Label htmlFor="full-on" className="font-semibold">Start a new full backup</Label>
                        </div>
                        <Switch id="full-on" checked={fullOn} onCheckedChange={setFullOn} />
                    </div>
                    <p className="text-sm font-medium">
                        {fullOn && fullCron ? describeCron(fullCron) : `When ${chainAgeRule}`}
                    </p>
                    {fullOn && (
                        <ScheduleFields id="full" schedule={full} repeats={["daily", "weekly", "monthly", "custom"]} onChange={setFull} />
                    )}
                    <p className="text-xs text-muted-foreground">
                        {fullOn
                            ? "Never starts a backup by itself: the first backup after this time is a full one. While this schedule is on, the chain age (full_every_days) no longer starts a full."
                            : "Turn on to start fulls on a schedule instead of on chain age."}
                    </p>
                </section>
            </div>

            <section className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
                <div className="text-sm font-semibold">Next backups</div>
                {!valid ? (
                    <p className="text-sm text-muted-foreground">Fix the schedule to see the next backups.</p>
                ) : preview.length > 0 ? (
                    <ul className="flex flex-col gap-1">
                        {preview.map(({ run, isFull }) => (
                            <li key={run.toISOString()} className="flex items-center justify-between text-sm">
                                <span>{formatRun(run)}</span>
                                <Badge variant={isFull ? "default" : "outline"}>{isFull ? "Full" : "Incremental"}</Badge>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Backups run when you click Backup.
                        {nextFullTime ? ` The first one after ${formatRun(nextFullTime)} is a full backup.` : ""}
                    </p>
                )}
                {valid && !fullOn && (
                    <p className="text-xs text-muted-foreground">
                        A full backup starts when {chainAgeRule}, or when you click Full backup.
                    </p>
                )}
            </section>

            <div className="flex justify-end">
                <Button onClick={save} disabled={!dirty || !valid || saving}>Save schedule</Button>
            </div>
        </div>
    );
};
