"use client";

import { useEffect } from "react";
import { useOnboarding } from "@onboardjs/react";
import { KeyRound, ShieldCheck } from "lucide-react";
import type { OnboardingMeta } from "@/features/onboarding/types";

export const StepSecurity = () => {
    const { next, updateContext, state } = useOnboarding();
    const meta = state?.context.flowData.meta as OnboardingMeta | undefined;
    const passkeyEnabled = meta?.passkeyEnabled ?? false;
    const alreadySecured = !!state?.context.flowData.security;

    useEffect(() => {
        if (alreadySecured) next();
    }, [alreadySecured]);

    const choose = async (method: "passkey" | "two-factor") => {
        await updateContext({ flowData: { ...state?.context.flowData, security: { method } } });
        await next();
    };

    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Secure your account</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {passkeyEnabled
                        ? "Set up a passkey for faster, safer sign-in."
                        : "Set up two-factor authentication to protect your account."}
                </p>
            </div>
            {passkeyEnabled ? (
                <button
                    type="button"
                    onClick={() => choose("passkey")}
                    className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full text-left"
                >
                    <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                        <KeyRound className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">Set up passkey</span>
                        <span className="text-xs text-muted-foreground">Faster, safer sign-in</span>
                    </div>
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => choose("two-factor")}
                    className="flex items-center gap-3 rounded-lg border border-border p-4 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full text-left"
                >
                    <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">Set up two-factor</span>
                        <span className="text-xs text-muted-foreground">Add an extra layer of security</span>
                    </div>
                </button>
            )}
        </div>
    );
};
