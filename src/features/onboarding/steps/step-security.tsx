"use client";

import { useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { TwoFactorSetupContent } from "@/features/profile/components/two-factor-setup-content";
import type { OnboardingMeta } from "@/features/onboarding/types";

export const StepSecurity = () => {
  const { next, updateContext, state } = useOnboarding();
  const meta = state?.context.flowData.meta as OnboardingMeta | undefined;
  const passkeyEnabled = meta?.passkeyEnabled ?? false;

  const [phase, setPhase] = useState<"choose" | "two-factor">("choose");

  const { mutate: addPasskey, isPending: isAddingPasskey } = useMutation({
    mutationFn: async () => {
      const result = await authClient.passkey.addPasskey({ name: "My Passkey" });
      if (result?.error) throw result.error;
      return result;
    },
    onSuccess: async () => {
      toast.success("Passkey added successfully.");
      await updateContext({ flowData: { ...state?.context.flowData, security: { method: "passkey" } } });
      await next();
    },
    onError: (e: any) => toast.error(e.message || "Failed to add passkey"),
  });

  const handleTwoFactorSuccess = async () => {
    await updateContext({ flowData: { ...state?.context.flowData, security: { method: "two-factor" } } });
    await next();
  };

  if (phase === "two-factor") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Set up two-factor</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add an extra layer of security to your account.
          </p>
        </div>
        <TwoFactorSetupContent onSuccess={handleTwoFactorSuccess} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Secure your account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choose a method to protect your account.
        </p>
      </div>

      {passkeyEnabled && (
        <button
          type="button"
          disabled={isAddingPasskey}
          onClick={() => addPasskey()}
          className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full text-left disabled:opacity-50"
        >
          <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
            {isAddingPasskey ? <Loader2 className="size-4 animate-spin" /> : <KeyRound className="size-4 text-muted-foreground" />}
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">Set up passkey</span>
            <span className="text-xs text-muted-foreground">Faster, safer sign-in with biometrics</span>
          </div>
        </button>
      )}

      <button
        type="button"
        onClick={() => setPhase("two-factor")}
        className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full text-left"
      >
        <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
          <ShieldCheck className="size-4 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">Set up two-factor authentication</span>
          <span className="text-xs text-muted-foreground">Secure your account with a TOTP app</span>
        </div>
      </button>

      <Button type="button" variant="ghost" onClick={() => next()}>
        Skip for now
      </Button>
    </div>
  );
};
