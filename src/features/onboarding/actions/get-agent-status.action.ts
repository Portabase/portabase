"use server";

import { userAction } from "@/lib/safe-actions/actions";
import { z } from "zod";
import { getAgentAction } from "@/features/agents/actions/agents.action";

export const getAgentStatusAction = userAction
  .schema(z.object({ agentId: z.string() }))
  .action(async ({ parsedInput }) => {
    const result = await getAgentAction(parsedInput.agentId);
    if (!result?.data?.data) return { connected: false };
    const agent = result.data.data;
    const lastContact = agent.lastContact ? new Date(agent.lastContact) : null;
    const connected =
      lastContact !== null && Date.now() - lastContact.getTime() < 60_000;
    return { connected };
  });
