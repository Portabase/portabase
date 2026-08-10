import {z} from "zod";

export const PolicyScopeSchema = z.object({
    type: z.enum(["database", "project"]),
    id: z.string().min(1),
});

export type PolicyScope = z.infer<typeof PolicyScopeSchema>;

export function scopeOwner(scope: PolicyScope): { databaseId: string | null; projectId: string | null } {
    return scope.type === "database"
        ? { databaseId: scope.id, projectId: null }
        : { databaseId: null, projectId: scope.id };
}
