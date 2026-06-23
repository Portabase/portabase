"use client";

import { Dices, Globe, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import type { AvatarMode } from "@/features/onboarding/types";

const MODES: { value: AvatarMode; label: string; description: string; icon: React.ReactNode }[] = [
  { value: "internal", label: "Internal", description: "Users upload their own avatar", icon: <Upload className="size-4" /> },
  { value: "gravatar", label: "Gravatar", description: "Avatar fetched from gravatar.com by email", icon: <Globe className="size-4" /> },
  { value: "dicebear", label: "DiceBear", description: "Auto-generated avatar via DiceBear", icon: <Dices className="size-4" /> },
];

type Props = {
  value: AvatarMode;
  onChange: (mode: AvatarMode) => void;
  disabled?: boolean;
};

export const AvatarModeSelector = ({ value, onChange, disabled }: Props) => (
  <div className="flex flex-col gap-2">
    <Label>Avatar mode</Label>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {MODES.map((mode) => {
        const isActive = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            disabled={disabled}
            onClick={() => { if (!isActive) onChange(mode.value); }}
            className={cn(
              "flex flex-col gap-3 rounded-xl border-2 p-4 text-left transition-all hover:bg-accent/50 disabled:opacity-50",
              isActive ? "border-primary bg-primary/5" : "border-muted/40",
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn("p-1.5 rounded-md", isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                {mode.icon}
              </div>
              <div className={cn("w-4 h-4 rounded-full border flex items-center justify-center transition-all", isActive ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">{mode.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{mode.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  </div>
);
