"use client";

import { useOnboarding } from "@onboardjs/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/auth-client";
import type {
  OnboardingAccountData,
  OnboardingMeta,
} from "@/features/onboarding/types";
import { ThemeKey, ThemeSelector } from "@/components/common/theme-selector";

const AVATAR_COLORS = [
  { name: "indigo", hex: "#4f46e5" },
  { name: "violet", hex: "#7c3aed" },
  { name: "rose", hex: "#e11d48" },
  { name: "orange", hex: "#ea580c" },
  { name: "amber", hex: "#d97706" },
  { name: "emerald", hex: "#059669" },
  { name: "cyan", hex: "#0891b2" },
  { name: "zinc", hex: "#52525b" },
];

export const StepPreferences = () => {
  const { next, updateContext, state } = useOnboarding();
  const { theme: currentTheme, setTheme } = useTheme();
  const preferences = state?.context.flowData.preferences ?? {
    theme: (currentTheme ?? "system") as ThemeKey,
  };
  const account = state?.context.flowData.account as
    | OnboardingAccountData
    | undefined;

  const initials = account
    ? `${account.firstName[0] ?? ""}${account.lastName[0] ?? ""}`.toUpperCase()
    : "PB";

  const selectedAvatarUrl = preferences.avatarUrl;

  const selectAvatar = async (color: string) => {
    const url = `/api/avatar?initials=${initials}&color=${encodeURIComponent(color)}`;
    await updateContext({
      flowData: {
        ...state?.context.flowData,
        preferences: { ...preferences, avatarUrl: url },
      },
    });
  };

  const selectTheme = async (theme: ThemeKey) => {
    // Apply immediately to the UI
    setTheme(theme);
    // Persist to DB so it survives page reload
    await authClient.updateUser({ theme });
    await updateContext({
      flowData: {
        ...state?.context.flowData,
        preferences: { ...preferences, theme },
      },
    });
  };

  const onContinue = async () => {
    // Save avatar to user profile if selected
    if (selectedAvatarUrl) {
      await authClient.updateUser({ image: selectedAvatarUrl });
    }
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

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Avatar</p>
        {/* Remplacement de la grid par un flex avec wrap */}
        <div className="flex flex-wrap gap-2">
          {AVATAR_COLORS.map((c) => {
            const url = `/api/avatar?initials=${initials}&color=${encodeURIComponent(c.hex)}`;
            const isSelected = selectedAvatarUrl === url;
            return (
              <button
                key={c.name}
                type="button"
                onClick={() => selectAvatar(c.hex)}
                className={cn(
                  // Ajout de shrink-0 pour éviter toute déformation
                  "rounded-full overflow-hidden transition-all shrink-0",
                  isSelected
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    : "opacity-70 hover:opacity-100",
                )}
              >
                <img
                  src={url}
                  alt={c.name}
                  width={40}
                  height={40}
                  className="size-10 rounded-full"
                />
              </button>
            );
          })}
        </div>
      </div>

      <Button type="button" onClick={onContinue}>
        Continue
      </Button>
    </div>
  );
};
