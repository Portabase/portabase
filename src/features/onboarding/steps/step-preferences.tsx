"use client";

import { useOnboarding } from "@onboardjs/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { ThemeKey, ThemeSelector } from "@/components/common/theme-selector";

export const StepPreferences = () => {
  const { next, updateContext, state } = useOnboarding();
  const { theme: currentTheme, setTheme } = useTheme();
  const preferences = state?.context.flowData.preferences ?? {
    theme: (currentTheme ?? "system") as ThemeKey,
  };

  const selectTheme = async (theme: ThemeKey) => {
    setTheme(theme);
    try {
      await authClient.updateUser({ theme });
      await updateContext({
        flowData: {
          ...state?.context.flowData,
          preferences: { ...preferences, theme },
        },
      });
    } catch {
      toast.error("Failed to save theme preference");
      setTheme(preferences.theme as ThemeKey);
    }
  };

  const onContinue = async () => {
    await next();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Your preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — personalise your workspace.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Theme</p>
        <ThemeSelector value={preferences.theme} onSelect={selectTheme} />
      </div>

      <Button type="button" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
};
