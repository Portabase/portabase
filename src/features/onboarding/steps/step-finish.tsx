"use client";

import { useEffect, useRef } from "react";
import { useOnboarding } from "@onboardjs/react";
import confetti from "canvas-confetti";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StepFinish = () => {
    const { next } = useOnboarding();
    const fired = useRef(false);

    useEffect(() => {
        if (fired.current) return;
        fired.current = true;
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }, []);

    return (
        <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
            <CheckCircle2 className="size-16 text-green-500" />
            <h1 className="text-2xl font-semibold">You&apos;re all set!</h1>
            <p className="text-sm text-muted-foreground">Your workspace is ready to use.</p>
            <Button type="button" onClick={async () => { await next(); }}>
                Go to dashboard
            </Button>
        </div>
    );
};
