"use server"

import {z} from "zod"
import {
    RetentionSettingsSchema
} from "@/features/database/schemas/retention-policy.schema";
import {PolicyScopeSchema} from "@/features/database/schemas/policy-scope.schema";
import {ActionError, userAction} from "@/lib/safe-actions/actions";
import {assertCanManagePolicyScope} from "@/features/database/utils/database-acl";
import {upsertRetentionPolicyService} from "@/features/database/services/retention-policy.service";


export const updateOrCreateBackupRetentionPolicyAction = userAction
    .inputSchema(
        z.object({
            scope: PolicyScopeSchema,
            settings: RetentionSettingsSchema,
        })
    )
    .action(async ({parsedInput}) => {
        const {scope, settings} = parsedInput;
        try {
            await assertCanManagePolicyScope(scope);
        } catch {
            throw new ActionError("Not authorized");
        }
        return {data: await upsertRetentionPolicyService(scope, settings)};
    });
