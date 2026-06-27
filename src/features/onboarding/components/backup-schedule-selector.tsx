"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { isValidCronPart } from "@/utils/cron";

export type BackupScheduleValue = {
  method: "manual" | "automatic";
  cron?: string;
};

const PRESETS = [
  { label: "Hourly",     sub: "Every hour",          cron: "0 * * * *"   },
  { label: "Every 6h",   sub: "4× per day",           cron: "0 */6 * * *" },
  { label: "Every 12h",  sub: "2× per day",           cron: "0 */12 * * *"},
  { label: "Daily",      sub: "Every day at midnight",cron: "0 0 * * *"   },
  { label: "Weekly",     sub: "Every Sunday",         cron: "0 0 * * 0"   },
  { label: "Monthly",    sub: "1st of each month",    cron: "0 0 1 * *"   },
] as const;

type PresetCron = (typeof PRESETS)[number]["cron"];

function isPresetCron(cron: string | undefined): cron is PresetCron {
  return PRESETS.some((p) => p.cron === cron);
}

function validateCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const types = ["minute", "hour", "day-of-month", "month", "day-of-week"] as const;
  return parts.every((p, i) => isValidCronPart(types[i], p));
}

type Props = {
  value: BackupScheduleValue;
  onChange: (value: BackupScheduleValue) => void;
};

export const BackupScheduleSelector = ({ value, onChange }: Props) => {
  const isCustom = !!value.cron && !isPresetCron(value.cron);
  const [customInput, setCustomInput] = useState(
    isCustom ? (value.cron ?? "") : "",
  );
  const [customError, setCustomError] = useState<string | null>(null);

  const handleMethodChange = (method: "manual" | "automatic") => {
    onChange({
      method,
      cron: method === "manual" ? undefined : (value.cron ?? "0 0 * * *"),
    });
  };

  const handlePresetClick = (cron: PresetCron) => {
    setCustomError(null);
    onChange({ ...value, cron });
  };

  const handleCustomChange = (raw: string) => {
    setCustomInput(raw);
    if (validateCron(raw)) {
      setCustomError(null);
      onChange({ ...value, cron: raw.trim() });
    } else {
      setCustomError("Invalid cron expression");
    }
  };

  const handleCustomFocus = () => {
    if (!customInput && value.cron && isPresetCron(value.cron)) {
      setCustomInput(value.cron);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <RadioGroup
        value={value.method}
        onValueChange={(m) => handleMethodChange(m as "manual" | "automatic")}
        className="grid grid-cols-2 gap-3"
      >
        {(
          [
            { id: "manual",    label: "Manual",    desc: "Trigger backups manually" },
            { id: "automatic", label: "Automatic", desc: "Scheduled via cron"       },
          ] as const
        ).map((opt) => (
          <Label
            key={opt.id}
            htmlFor={opt.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
              value.method === opt.id
                ? "border-primary bg-primary/5"
                : "hover:bg-muted/50",
            )}
          >
            <RadioGroupItem value={opt.id} id={opt.id} />
            <div>
              <p className="font-medium text-sm">{opt.label}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          </Label>
        ))}
      </RadioGroup>

      {value.method === "automatic" && (
        <div className="flex flex-col gap-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
            Frequency
          </Label>

          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.cron}
                type="button"
                onClick={() => handlePresetClick(p.cron)}
                className={cn(
                  "flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm transition-all",
                  value.cron === p.cron && !customError
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:bg-accent/50 hover:border-primary/20",
                )}
              >
                <span className="font-medium">{p.label}</span>
                <span className="text-[11px] text-muted-foreground">{p.sub}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Custom expression
            </Label>
            <Input
              placeholder="e.g. 0 */4 * * *"
              value={customInput}
              onFocus={handleCustomFocus}
              onChange={(e) => handleCustomChange(e.target.value)}
              className={cn(
                "font-mono text-sm",
                isCustom && !customError && "border-primary",
                customError && "border-destructive",
              )}
            />
            {customError ? (
              <p className="text-xs text-destructive">{customError}</p>
            ) : isCustom ? (
              <p className="text-xs text-muted-foreground font-mono">{value.cron}</p>
            ) : null}
          </div>

          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
            {value.cron ?? "0 0 * * *"}
          </div>
        </div>
      )}
    </div>
  );
};
