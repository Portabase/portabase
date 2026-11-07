"use server";

import {and, eq, not} from "drizzle-orm";
import {z} from "zod";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {maskDatabasesSecretsForClient} from "@/features/database/utils/credential-fields";
import {withLastBackupAndLiveness} from "@/features/projects/utils/project-databases";
import {getOrganization} from "@/lib/auth/auth";
import {ActionError, userAction} from "@/lib/safe-actions/actions";

export const getProjectDatabasesAction = userAction
    .inputSchema(z.object({projectId: z.uuid()}))
    .action(async ({parsedInput}) => {
        const organization = await getOrganization({});
        if (!organization) throw new ActionError("No active organization.");

        const project = await db.query.project.findFirst({
            where: and(
                eq(drizzleDb.schemas.project.id, parsedInput.projectId),
                eq(drizzleDb.schemas.project.organizationId, organization.id),
                not(eq(drizzleDb.schemas.project.isArchived, true)),
            ),
            columns: {id: true},
            with: {databases: true},
        });
        if (!project) throw new ActionError("Project not found.");

        return withLastBackupAndLiveness(maskDatabasesSecretsForClient(project.databases));
    });
