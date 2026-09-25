"use client";

import { useOnboarding } from "@onboardjs/react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { ThemeKey, ThemeSelector } from "@/components/common/theme-selector";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {useState} from "react";
import {updateProxySettingsAction} from "@/features/settings/actions/proxy.action";
import {ProxySettingsSchema} from "@/features/settings/schemas/proxy.schema";

export const StepPreferences = () => {
  const { next, updateContext, state } = useOnboarding();
  const { theme: currentTheme, setTheme } = useTheme();
  const [httpProxy, setHttpProxy] = useState(
    String(state?.context.flowData.httpProxy ?? ""),
  );
  const [saving, setSaving] = useState(false);
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
    const parsed = ProxySettingsSchema.safeParse({ httpProxy });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid proxy URL");
      return;
    }

    setSaving(true);
    try {
      const result = await updateProxySettingsAction({name: "system", data: parsed.data});
      if (result?.serverError || !result?.data?.data) {
        throw new Error(result?.serverError || "Failed to save proxy settings");
      }
      await updateContext({
        flowData: {
          ...state?.context.flowData,
          httpProxy: parsed.data.httpProxy,
        },
      });
      await next();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save proxy settings");
    } finally {
      setSaving(false);
    }
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
        <Label htmlFor="http-proxy">HTTP proxy URL</Label>
        <Input
          id="http-proxy"
          type="url"
          value={httpProxy}
          onChange={(event) => setHttpProxy(event.target.value)}
          placeholder="http://user:password@proxy.example.com:8080"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Optional — used by storage and notification services.
        </p>
      </div>

      <Button type="button" onClick={onContinue} disabled={saving}>
        Continue
      </Button>
    </div>
  );
};
