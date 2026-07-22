import { OnboardingStep } from "@onboardjs/react";
import { StepLogin } from "@/features/onboarding/steps/step-login";
import { StepAccountInfo } from "@/features/onboarding/steps/step-account-info";
import { StepSecurity } from "@/features/onboarding/steps/step-security";
import { StepPreferences } from "@/features/onboarding/steps/step-preferences";
import { StepOrgCreate } from "@/features/onboarding/steps/step-org-create";
import { StepNotifier } from "@/features/onboarding/steps/step-notifier";
import { StepStorage } from "@/features/onboarding/steps/step-storage";
import { StepDefaults } from "@/features/onboarding/steps/step-defaults";
import { StepAgentCreate } from "@/features/onboarding/steps/step-agent-create";
import { StepAgentKey } from "@/features/onboarding/steps/step-agent-key";
import { StepAgentWaiting } from "@/features/onboarding/steps/step-agent-waiting";
import { StepProjectCreate } from "@/features/onboarding/steps/step-project-create";
import { StepDbSettings } from "@/features/onboarding/steps/step-db-settings";
import { StepFinish } from "@/features/onboarding/steps/step-finish";

export const onboardingSteps: OnboardingStep[] = [
  {
    id: "login",
    component: StepLogin,
    isSkippable: false,
    nextStep: (ctx: any) =>
      ctx.flowData?.meta?.hasExistingUsers ? "preferences" : "account-info",
  },
  {
    id: "account-info",
    component: StepAccountInfo,
    isSkippable: false,
    nextStep: (ctx: any) =>
      ctx.flowData?.meta?.passkeyEnabled ? "preferences" : "security",
  },
  {
    id: "security",
    component: StepSecurity,
    isSkippable: true,
    skipToStep: "preferences",
    nextStep: "preferences",
  },
  {
    id: "preferences",
    component: StepPreferences,
    isSkippable: true,
    skipToStep: "org-create",
    nextStep: "org-create",
  },
  {
    id: "org-create",
    component: StepOrgCreate,
    isSkippable: false,
    //nextStep: "invite-members",
    nextStep: "notifier",
  },
  // {
  //   id: "invite-members",
  //   component: StepInviteMembers,
  //   isSkippable: true,
  //   skipToStep: "notifier",
  //   nextStep: "notifier",
  // },
  {
    id: "notifier",
    component: StepNotifier,
    isSkippable: true,
    skipToStep: "storage",
    nextStep: "storage",
  },
  {
    id: "storage",
    component: StepStorage,
    isSkippable: true,
    skipToStep: (ctx: any) => {
      const notifiers = (ctx.flowData?.notifiers as unknown[]) || [];
      const storages = (ctx.flowData?.storages as unknown[]) || [];
      return notifiers.length === 0 && storages.length === 0
        ? "agent-create"
        : "defaults";
    },
    nextStep: (ctx: any) => {
      const notifiers = (ctx.flowData?.notifiers as unknown[]) || [];
      const storages = (ctx.flowData?.storages as unknown[]) || [];
      return notifiers.length === 0 && storages.length === 0
        ? "agent-create"
        : "defaults";
    },
  },
  {
    id: "defaults",
    component: StepDefaults,
    isSkippable: true,
    skipToStep: "agent-create",
    nextStep: "agent-create",
  },
  {
    id: "agent-create",
    component: StepAgentCreate,
    isSkippable: true,
    skipToStep: (ctx: any) => {
      const hasProject = !!ctx.flowData?.project;
      return hasProject ? "project-create" : "finish";
    },
    nextStep: (ctx: any) => {
      const agents = ctx.flowData?.agents as unknown[] | undefined;
      const hasProject = !!ctx.flowData?.project;
      if (agents && agents.length > 0) return "agent-key";
      return hasProject ? "project-create" : "finish";
    },
  },
  {
    id: "agent-key",
    component: StepAgentKey,
    isSkippable: false,
    nextStep: (ctx: any) => {
      const agents = (ctx.flowData?.agents as any[]) || [];
      const isConnected = agents.some((a) => a.connected);
      return isConnected ? "project-create" : "agent-waiting";
    },
  },
  {
    id: "agent-waiting",
    component: StepAgentWaiting,
    isSkippable: true,
    skipToStep: "project-create",
    nextStep: "project-create",
  },
  {
    id: "project-create",
    component: StepProjectCreate,
    isSkippable: true,
    skipToStep: (ctx: any) => {
      const agents = (ctx.flowData?.agents as any[]) || [];
      if (agents.length === 0) return "finish";
      const isAgentConnected = agents.some((a) => a.connected);
      const databaseIds =
        (ctx.flowData?.project?.databaseIds as string[]) || [];
      return !isAgentConnected || databaseIds.length === 0
        ? "finish"
        : "db-settings";
    },
    nextStep: (ctx: any) => {
      const agents = (ctx.flowData?.agents as any[]) || [];
      if (agents.length === 0) return "finish";
      const isAgentConnected = agents.some((a) => a.connected);
      const databaseIds =
        (ctx.flowData?.project?.databaseIds as string[]) || [];
      return !isAgentConnected || databaseIds.length === 0
        ? "finish"
        : "db-settings";
    },
  },
  {
    id: "db-settings",
    component: StepDbSettings,
    isSkippable: true,
    skipToStep: "finish",
    nextStep: "finish",
  },
  {
    id: "finish",
    component: StepFinish,
    isSkippable: false,
    nextStep: null,
  },
];
