"use server";

import {z} from "zod";
import {eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {withUpdatedAt} from "@/db/utils";
import {ActionError, userAction} from "@/lib/safe-actions/actions";
import {assertCanManagePolicyScope} from "@/features/database/utils/database-acl";
import {assertCanManageOrganization} from "@/lib/acl/organization-guard";

const EncryptionScopeSchema = z.object({
    type: z.enum(["database", "organization"]),
    id: z.string().uuid(),
});

export type EncryptionScope = z.infer<typeof EncryptionScopeSchema>;

export const updateEncryptionAction = userAction
    .inputSchema(z.object({scope: EncryptionScopeSchema, enabled: z.boolean()}))
    .action(async ({parsedInput: {scope, enabled}, ctx}) => {
        const authorization = scope.type === "organization"
            ? assertCanManageOrganization(ctx.user, scope.id)
            : assertCanManagePolicyScope({type: scope.type, id: scope.id});
        await authorization.catch(() => {
            throw new ActionError("Not authorized");
        });

        const values = withUpdatedAt({encryption: enabled});
        if (scope.type === "database") {
            await db.update(drizzleDb.schemas.database).set(values).where(eq(drizzleDb.schemas.database.id, scope.id));
        } else {
            await db.update(drizzleDb.schemas.organization).set(values).where(eq(drizzleDb.schemas.organization.id, scope.id));
        }
        return {data: {enabled}};
    });
