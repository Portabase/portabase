import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organization } from "@/db/schema/03_organization";
import { member } from "@/db/schema/04_member";
import { currentUser } from "@/lib/auth/current-user";
import { getSettings } from "@/db/services/setting";
import { hasUsers } from "@/db/services/user";
import {
  getUserOrganization,
  getUserOwnOrganization,
} from "@/db/services/organization";
import { getOrganizationProject } from "@/db/services/project";
import { getOrganizationAgents } from "@/db/services/agent";
import { getDatabasesSettings } from "@/db/services/database";
import { getOrganizationChannels } from "@/db/services/notification-channel";
import { getOrganizationStorageChannels } from "@/db/services/storage-channel";
import type { AgentWith } from "@/db/schema/08_agent";
import { env } from "@/env.mjs";
import type {
  OnboardingDatabase,
  OnboardingFlowData,
  OnboardingMeta,
} from "@/features/onboarding/types";
import { getOAuthProviders } from "@/lib/auth/oauth";
import { getOidcProviders } from "@/lib/auth/oidc";
import { generateEdgeKey } from "@/utils/edge_key";
import { getServerUrl } from "@/utils/get-server-url";

export type ResolvedOnboardingState =
  | { redirect: "/dashboard/home" }
  | { stepId: string; flowData: Partial<OnboardingFlowData> };

export async function resolveOnboardingState(): Promise<ResolvedOnboardingState> {
  const settings = await getSettings();
  if (settings?.onboarding) {
    return { redirect: "/dashboard/home" };
  }

  const meta: OnboardingMeta = {
    passkeyEnabled: env.AUTH_PASSKEY_ENABLED === "true",
    emailPasswordEnabled: env.AUTH_EMAIL_PASSWORD_ENABLED === "true",
    hasExistingUsers: false,
    ssoProviders: [],
    oauthProviders: [],
    defaultUserMode: !!(env.AUTH_DEFAULT_USER && env.AUTH_DEFAULT_PASSWORD),
    resumeStepId: "login",
  };

  meta.hasExistingUsers = await hasUsers();

  for (const p of getOidcProviders()) {
    meta.ssoProviders.push({
      id: p.id,
      label: p.title,
      icon: p.icon,
      description: p.description || undefined,
    });
  }

  for (const p of getOAuthProviders()) {
    meta.oauthProviders.push({ id: p.id, label: p.title, icon: p.icon });
  }

  const user = await currentUser();
  if (!user) {
    return { stepId: "login", flowData: { meta } };
  }

  const inDefaultOrg = await getUserOrganization(user.id);
  if (!inDefaultOrg) {
    const defaultOrg = await db.query.organization.findFirst({
      where: eq(organization.slug, "default"),
    });
    if (defaultOrg) {
      await db.insert(member).values({
        userId: user.id,
        organizationId: defaultOrg.id,
        role: "owner",
      });
    }
  }

  const org = await getUserOwnOrganization(user.id);
  if (!org) {
    meta.resumeStepId = "preferences";
    return { stepId: "preferences", flowData: { meta } };
  }

  const orgData = { id: org.id, name: org.name };

  const [notifierChannels, storageChannels, agents, project] =
    await Promise.all([
      getOrganizationChannels(org.id),
      getOrganizationStorageChannels(org.id),
      getOrganizationAgents(org.id),
      getOrganizationProject(org.id),
    ]);

  const notifiers = notifierChannels.map((n) => ({
    id: n.id,
    provider: n.provider,
    label: n.provider,
    name: n.name,
    config: (n.config as Record<string, unknown>) ?? {},
    organizationId: n.organizationId ?? null,
  }));

  const storages = storageChannels
    .filter((s) => s.provider !== "local")
    .map((s) => ({
      id: s.id,
      provider: s.provider,
      label: s.provider,
      name: s.name,
      config: (s.config as Record<string, unknown>) ?? {},
      organizationId: s.organizationId ?? null,
    }));

  const defaults = {
    notifierId: settings?.defaultNotificationChannelId ?? undefined,
    storageId: settings?.defaultStorageChannelId ?? undefined,
  };

  const agentData = await Promise.all(
    (agents ?? []).map(async (a) => ({
      id: a.id,
      name: a.name,
      edgeKey: await generateEdgeKey(getServerUrl(), a.id),
      connected: !!a.lastContact,
    })),
  );

  const databases = (agents as AgentWith[]).flatMap((a) =>
    (a.databases ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      engine: (d.dbms === "postgresql"
        ? "postgres"
        : d.dbms) as OnboardingDatabase["engine"],
    })),
  );

  const dbSettings = await getDatabasesSettings(databases.map((d) => d.id));

  const fullData: Partial<OnboardingFlowData> = {
    meta,
    org: orgData,
    notifiers,
    storages,
    defaults,
    agents: agentData,
    databases,
    dbSettings,
    ...(project
      ? {
          project: {
            id: project.id,
            name: project.name,
            description: "",
            databaseIds:
              (project as any).databases?.map((db: any) => db.id) ?? [],
          },
        }
      : {}),
  };

  const hasAgents = agents && agents.length > 0;

  const defaultsConfigured =
    !!settings?.defaultNotificationChannelId &&
    !!settings?.defaultStorageChannelId;

  if (project) {
    if (!hasAgents) {
      if (notifiers.length === 0) {
        meta.resumeStepId = "notifier";
        return { stepId: "notifier", flowData: fullData };
      }
      if (storages.length === 0) {
        meta.resumeStepId = "storage";
        return { stepId: "storage", flowData: fullData };
      }
      if (defaultsConfigured) {
        meta.resumeStepId = "agent-create";
        return { stepId: "agent-create", flowData: fullData };
      }
      meta.resumeStepId = "defaults";
      return { stepId: "defaults", flowData: fullData };
    }

    const agentHasPinged = !!agents[0]?.lastContact;
    if (!agentHasPinged) {
      meta.resumeStepId = "agent-key";
      return { stepId: "agent-key", flowData: fullData };
    }

    const projectDatabaseIds: string[] =
      (project as any).databases?.map((db: any) => db.id) ?? [];
    if (projectDatabaseIds.length > 0) {
      meta.resumeStepId = "db-settings";
      return { stepId: "db-settings", flowData: fullData };
    }
    meta.resumeStepId = "project-create";
    return { stepId: "project-create", flowData: fullData };
  }

  if (hasAgents) {
    const agentHasPinged = !!agents[0]?.lastContact;
    const stepId = agentHasPinged ? "project-create" : "agent-key";
    meta.resumeStepId = stepId;
    return { stepId, flowData: fullData };
  }

  if (notifiers.length === 0) {
    meta.resumeStepId = "notifier";
    return { stepId: "notifier", flowData: fullData };
  }

  if (storages.length === 0) {
    meta.resumeStepId = "storage";
    return { stepId: "storage", flowData: fullData };
  }

  if (defaultsConfigured) {
    meta.resumeStepId = "agent-create";
    return { stepId: "agent-create", flowData: fullData };
  }

  meta.resumeStepId = "defaults";
  return { stepId: "defaults", flowData: fullData };
}
