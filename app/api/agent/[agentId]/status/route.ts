import { NextResponse } from "next/server";
import { handleDatabases } from "@/features/agents/utils/status/status.helpers";
import { Body } from "@/features/agents/types";
import * as drizzleDb from "@/db";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import { withUpdatedAt } from "@/db/utils";
import { logger } from "@/lib/logger";
import { isUUID } from "@/utils/text";

const log = logger.child({ module: "api/agent/status/route" });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ agentId: string }> },
) {
  try {
    const agentId = (await params).agentId;
    log.debug(`Agent ID: ${agentId}`);
    const body: Body = await request.json();
    const lastContact = new Date();
    let message: string;

    if (!isUUID(agentId)) {
      message = "agentId is not a valid uuid";
      log.error({ error: message }, "An error occurred");
      return NextResponse.json(
        { error: "agentId is not a valid uuid" },
        { status: 500 },
      );
    }

    const agent = await db.query.agent.findFirst({
      where: and(
        eq(drizzleDb.schemas.agent.id, agentId),
        eq(drizzleDb.schemas.agent.isArchived, false),
      ),
    });

    if (!agent) {
      message = "Agent not found";
      return NextResponse.json({ error: message }, { status: 404 });
    }

    const [settings] = await db
      .select()
      .from(drizzleDb.schemas.setting)
      .where(eq(drizzleDb.schemas.setting.name, "system"))
      .limit(1);
    if (!settings) {
      return NextResponse.json({ error: "An error occurred" }, { status: 404 });
    }

    const databasesResponse = await handleDatabases(
      body,
      agent,
      lastContact,
      settings,
    );

    await db
      .update(drizzleDb.schemas.agent)
      .set(
        withUpdatedAt({
          version: body.version,
          lastContact: lastContact,
          healthErrorCount: null,
        }),
      )
      .where(eq(drizzleDb.schemas.agent.id, agentId));

    await db.insert(drizzleDb.schemas.healthcheckLog).values({
      kind: "agent",
      status: "success",
      objectId: agentId,
      date: lastContact,
    });

    const response = {
      agent: {
        id: agentId,
        lastContact: lastContact,
      },
      databases: databasesResponse,
    };

    return Response.json(response);
  } catch (error) {
    log.error({ error: error }, "Error in POST handler");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
