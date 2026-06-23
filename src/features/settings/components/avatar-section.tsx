"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Setting } from "@/db/schema/01_setting";
import { updateAvatarModeAction } from "@/features/settings/actions/avatar.action";
import { AvatarModeSelector } from "@/features/settings/components/avatar-mode-selector";
import { DicebearStylePicker } from "@/features/settings/components/dicebear-style-picker";
import type { AvatarMode } from "@/features/onboarding/types";

type Props = { settings: Setting };

export const SettingsAvatarSection = ({ settings }: Props) => {
  const router = useRouter();
  const [avatarMode, setAvatarMode] = useState<AvatarMode>(settings.avatarMode ?? "internal");
  const [dicebearStyle, setDicebearStyle] = useState<string>(settings.dicebearStyle ?? "thumbs");

  const mutation = useMutation({
    mutationFn: async ({ mode, style }: { mode: AvatarMode; style: string }) => {
      const result = await updateAvatarModeAction({ name: "system", avatarMode: mode, dicebearStyle: style });
      if (result?.data?.success === false || result?.serverError) {
        throw new Error(result?.serverError ?? "Failed to update");
      }
    },
    onSuccess: () => {
      toast.success("Avatar settings saved");
      router.refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleModeChange = (mode: AvatarMode) => {
    setAvatarMode(mode);
    mutation.mutate({ mode, style: dicebearStyle });
  };

  const handleStyleChange = (style: string) => {
    setDicebearStyle(style);
    mutation.mutate({ mode: avatarMode, style });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">Avatar</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose how user avatars are generated across the platform.
        </p>
      </div>

      <AvatarModeSelector value={avatarMode} onChange={handleModeChange} disabled={mutation.isPending} />

      {avatarMode === "dicebear" && (
        <DicebearStylePicker value={dicebearStyle} onChange={handleStyleChange} disabled={mutation.isPending} />
      )}
    </div>
  );
};
