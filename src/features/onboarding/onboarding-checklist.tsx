"use client";

import { useOnboarding } from "@onboardjs/react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const CHECKLIST_STEPS = [
  { id: "login", label: "Sign in" },
  { id: "account-info", label: "Your account" },
  { id: "security", label: "Security" },
  { id: "preferences", label: "Preferences" },
  { id: "org-create", label: "Organisation" },
  // { id: "invite-members", label: "Team members" },
  { id: "notifier", label: "Notifications" },
  { id: "storage", label: "Storage" },
  { id: "defaults", label: "Defaults" },
  { id: "agent-create", label: "Agent setup" },
  { id: "agent-key", label: "Agent key" },
  { id: "agent-waiting", label: "Agent connection" },
  { id: "project-create", label: "Project" },
  { id: "db-settings", label: "Database settings" },
  { id: "finish", label: "Done" },
] as const;

export const OnboardingChecklist = () => {
  const { state } = useOnboarding();
  if (!state) return null;

  const currentId = state.currentStep?.id ?? "";
  const currentIndex = CHECKLIST_STEPS.findIndex((s) => s.id === currentId);

  return (
    <div className="flex flex-col gap-0 p-6 h-full">
      <div className="flex flex-col relative">
        {CHECKLIST_STEPS.map((step, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isLast = i === CHECKLIST_STEPS.length - 1;

          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                {isCompleted ? (
                  <CheckCircle2 className="size-4 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <Circle
                    className={cn(
                      "size-4 shrink-0 mt-0.5",
                      isCurrent ? "text-primary" : "text-zinc-700",
                    )}
                  />
                )}
                {!isLast && (
                  <div
                    className={cn(
                      "w-px flex-1 mt-1 mb-1 min-h-[16px]",
                      isCompleted ? "bg-green-500/40" : "bg-zinc-800",
                    )}
                  />
                )}
              </div>

              <p
                className={cn(
                  "text-sm pb-4",
                  isCompleted && "text-zinc-400",
                  isCurrent && "text-white font-medium",
                  !isCompleted && !isCurrent && "text-zinc-600",
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
