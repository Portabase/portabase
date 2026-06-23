"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDiceBearStyles } from "@/features/settings/hooks/use-dicebear-styles";

const DEMO_SEED = "portabase";

type Props = {
  value: string;
  onChange: (style: string) => void;
  disabled?: boolean;
  maxHeight?: string;
};

export const DicebearStylePicker = ({ value, onChange, disabled, maxHeight = "max-h-96" }: Props) => {
  const dicebearState = useDiceBearStyles();

  return (
    <div className="flex flex-col gap-2 mt-1 p-3 rounded-xl border border-border bg-muted/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {dicebearState.status === "error" && (
            <span className="flex items-center gap-1 text-[10px] text-amber-500">
              <AlertCircle className="size-3" /> offline
            </span>
          )}
        </div>
      </div>

      {dicebearState.status === "loading" && (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {dicebearState.status === "error" && (
        <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted-foreground">
          <AlertCircle className="size-5 text-amber-500" />
          <span className="text-xs">
            Unable to load styles — check your connection
          </span>
        </div>
      )}

      {dicebearState.status === "success" && (
        <div className={cn("overflow-y-auto scrollbar-hide", maxHeight)}>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {dicebearState.styles.map((style) => {
              const isActive = value === style;
              return (
                <button
                  key={style}
                  type="button"
                  disabled={disabled}
                  onClick={() => { if (!isActive) onChange(style); }}
                  title={style}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border-2 p-1.5 transition-all hover:bg-accent/50 disabled:opacity-50",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-transparent hover:border-muted",
                  )}
                >
                  <img
                    src={`https://api.dicebear.com/10.x/${style}/svg?seed=${DEMO_SEED}`}
                    alt={style}
                    width={36}
                    height={36}
                    loading="lazy"
                    className="size-9 rounded bg-muted"
                  />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center leading-tight">
                    {style}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
