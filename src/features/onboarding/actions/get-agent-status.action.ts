"use server";

import { userAction } from "@/lib/safe-actions/actions";
import { z } from "zod";
import { getAgentAction } from "@/features/agents/actions/agents.action";
import { isAgentOnline } from "@/features/agents/utils/status/agent-status";

export const getAgentStatusAction = userAction
  .schema(z.object({ agentId: z.string() }))
  .action(async ({ parsedInput }) => {
    const result = await getAgentAction(parsedInput.agentId);
    if (!result?.data?.data) return { connected: false };
    return { connected: isAgentOnline(result.data.data.lastContact) };
  });
