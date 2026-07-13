"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarkOnboardingDone } from "@/features/onboarding/hooks/use-mark-onboarding-done";

export const StepFinish = () => {
  const router = useRouter();
  const fired = useRef(false);
  const mutation = useMarkOnboardingDone();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 h-full text-center">
      <CheckCircle2 className="size-16 text-green-500" />
      <h1 className="text-2xl font-semibold">You&apos;re all set!</h1>
      <p className="text-sm text-muted-foreground">
        Your workspace is ready to use.
      </p>
      <Button
        type="button"
        disabled={mutation.isPending || isRedirecting}
        onClick={async () => {
          await mutation.mutateAsync();
          setIsRedirecting(true);
          router.push("/dashboard/home");
        }}
      >
        Go to dashboard
      </Button>
    </div>
  );
};
