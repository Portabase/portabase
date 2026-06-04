"use server";

import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq, isNull } from "drizzle-orm";
import { getHealthLast12hLogs } from "@/db/services/healthcheck";
import type { AgentWithChecks } from "@/features/stats/types";

export async function getAgentsWithRecentHealthchecks(): Promise<AgentWithChecks[]> {
  const agents = await db
    .select({
      id: drizzleDb.schemas.agent.id,
      name: drizzleDb.schemas.agent.name,
      lastContact: drizzleDb.schemas.agent.lastContact,
      organizationId: drizzleDb.schemas.agent.organizationId,
    })
    .from(drizzleDb.schemas.agent)
    .where(
      and(
        eq(drizzleDb.schemas.agent.isArchived, false),
        isNull(drizzleDb.schemas.agent.deletedAt)
      )
    );

  return Promise.all(
    agents.map(async (agent) => {
      const recentChecks = await getHealthLast12hLogs({ id: agent.id });
      return {
        ...agent,
        recentChecks: recentChecks.map((c) => ({ date: c.date, status: c.status })),
      };
    })
  );
}
