// src/features/onboarding/onboarding-steps.tsx
import { OnboardingStep } from "@onboardjs/react";
import { StepSsoGate } from "@/features/onboarding/steps/step-sso-gate";
import { StepAccountInfo } from "@/features/onboarding/steps/step-account-info";
import { StepSecurity } from "@/features/onboarding/steps/step-security";
import { StepPreferences } from "@/features/onboarding/steps/step-preferences";
import { StepOrgCreate } from "@/features/onboarding/steps/step-org-create";
import { StepInviteMembers } from "@/features/onboarding/steps/step-invite-members";
import { StepNotifier } from "@/features/onboarding/steps/step-notifier";
import { StepStorage } from "@/features/onboarding/steps/step-storage";
import { StepDefaults } from "@/features/onboarding/steps/step-defaults";
import { StepAgentCreate } from "@/features/onboarding/steps/step-agent-create";
import { StepAgentWaiting } from "@/features/onboarding/steps/step-agent-waiting";
import { StepProjectCreate } from "@/features/onboarding/steps/step-project-create";
import { StepDbSettings } from "@/features/onboarding/steps/step-db-settings";
import { StepFinish } from "@/features/onboarding/steps/step-finish";
import { mockSsoConfig } from "@/features/onboarding/onboarding.mock";

export const onboardingSteps: OnboardingStep[] = [
    {
        id: "sso-gate",
        component: StepSsoGate,
        isSkippable: !mockSsoConfig.forced as true,
        skipToStep: undefined,
        nextStep: "account-info",
    },
    {
        id: "account-info",
        component: StepAccountInfo,
        isSkippable: false,
        nextStep: "security",
    },
    {
        id: "security",
        component: StepSecurity,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: "preferences",
    },
    {
        id: "preferences",
        component: StepPreferences,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: "org-create",
    },
    {
        id: "org-create",
        component: StepOrgCreate,
        isSkippable: false,
        nextStep: "invite-members",
    },
    {
        id: "invite-members",
        component: StepInviteMembers,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: "notifier",
    },
    {
        id: "notifier",
        component: StepNotifier,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: "storage",
    },
    {
        id: "storage",
        component: StepStorage,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: "defaults",
    },
    {
        id: "defaults",
        component: StepDefaults,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: "agent-create",
    },
    {
        id: "agent-create",
        component: StepAgentCreate,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: (ctx: any) => {
            const agents = ctx.flowData?.agents as unknown[] | undefined;
            return agents && agents.length > 0 ? "agent-waiting" : "finish";
        },
    },
    {
        id: "agent-waiting",
        component: StepAgentWaiting,
        isSkippable: false,
        nextStep: "project-create",
    },
    {
        id: "project-create",
        component: StepProjectCreate,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: "db-settings",
    },
    {
        id: "db-settings",
        component: StepDbSettings,
        isSkippable: true,
        skipToStep: undefined,
        nextStep: "finish",
    },
    {
        id: "finish",
        component: StepFinish,
        isSkippable: false,
        nextStep: null,
    },
];
