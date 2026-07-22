import {eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {currentUser} from "@/lib/auth/current-user";
import {getActiveMember, getOrganization} from "@/lib/auth/auth";
import {computeOrganizationPermissions} from "@/lib/acl/organization-acl";
import {isAgentOnline} from "@/features/agents/utils/status/agent-status";

export class DatabaseNotFoundError extends Error {
    constructor(databaseId: string) {
        super(`Database not found or update failed: ${databaseId}`);
        this.name = "DatabaseNotFoundError";
    }
}

export class UnauthorizedError extends Error {
    constructor(databaseId: string) {
        super(`Not authorized to delete this database: ${databaseId}`);
        this.name = "UnauthorizedError";
    }
}

export class AgentOnlineError extends Error {
    constructor(databaseId: string) {
        super(`Agent must be offline to delete this database: ${databaseId}`);
        this.name = "AgentOnlineError";
    }
}

export async function assertCanDeleteDatabase(databaseId: string): Promise<void> {
    const database = await db.query.database.findFirst({
        where: eq(drizzleDb.schemas.database.id, databaseId),
        with: {
            agent: true,
        },
    });

    if (!database || !database.agent) {
        throw new DatabaseNotFoundError(databaseId);
    }

    const user = await currentUser();
    if (!user) {
        throw new UnauthorizedError(databaseId);
    }

    const agent = database.agent;
    const isAdmin = user.role === "superadmin" || user.role === "admin";

    let authorized: boolean;
    if (agent.organizationId === null) {
        authorized = isAdmin;
    } else {
        const organization = await getOrganization({});
        const activeMember = await getActiveMember();
        const canManage = activeMember
            ? computeOrganizationPermissions(activeMember).canManageAgents
            : false;

        const hasAccess =
            !!organization && agent.organizationId === organization.id;
        authorized = canManage && hasAccess;
    }

    if (!authorized) {
        throw new UnauthorizedError(databaseId);
    }

    if (isAgentOnline(agent.lastContact)) {
        throw new AgentOnlineError(databaseId);
    }
}
