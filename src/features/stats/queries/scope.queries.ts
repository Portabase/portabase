import { db } from "@/db";
import { and, eq, inArray } from "drizzle-orm";
import { currentUser } from "@/lib/auth/current-user";
import { getActiveMember } from "@/lib/auth/auth";
import { member } from "@/db/schema/04_member";
import { organizationAgent } from "@/db/schema/08_agent";
import { database } from "@/db/schema/07_database";
import { computeOrganizationPermissions } from "@/lib/acl/organization-acl";
import type { AgentLinkAccess } from "@/features/stats/types";

export type DashboardScope = string[] | null;

const INSTANCE_ROLES = ["admin", "superadmin"];

const ORG_READ_ROLES = ["owner", "admin", "member"];

export async function getDashboardScope(): Promise<DashboardScope> {
  const user = await currentUser();
  if (!user?.role) return [];

  if (INSTANCE_ROLES.includes(user.role)) return null;
  if (user.role !== "user") return [];

  const rows = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(
      and(eq(member.userId, user.id), inArray(member.role, ORG_READ_ROLES)),
    );

  return rows.map((r) => r.organizationId);
}

export function isEmptyScope(scope: DashboardScope): boolean {
  return scope !== null && scope.length === 0;
}

export async function getAgentLinkAccess(): Promise<AgentLinkAccess> {
  const [user, activeMember] = await Promise.all([
    currentUser(),
    getActiveMember(),
  ]);

  const { canManageAgents } = computeOrganizationPermissions(
    activeMember ?? null,
  );

  return {
    isInstanceAdmin: user?.role ? INSTANCE_ROLES.includes(user.role) : false,
    activeOrganizationId: activeMember?.organizationId ?? null,
    canManageOrgAgents: canManageAgents,
  };
}

export function scopedAgentIds(orgIds: string[]) {
  return db
    .select({ id: organizationAgent.agentId })
    .from(organizationAgent)
    .where(inArray(organizationAgent.organizationId, orgIds));
}

export function scopedDatabaseIds(orgIds: string[]) {
  return db
    .select({ id: database.id })
    .from(database)
    .where(inArray(database.agentId, scopedAgentIds(orgIds)));
}
