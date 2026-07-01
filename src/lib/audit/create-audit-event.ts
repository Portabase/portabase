"use server"

import {db, schemas} from "@/db";
import {createAuditEventInputSchema, type CreateAuditEventInput} from "@/lib/audit/schema";
import {auditEventCatalog} from "@/features/audit/catalog";

export async function createAuditEvent(input: CreateAuditEventInput) {
    const parsedInput = createAuditEventInputSchema.parse(input);
    const catalogEntry = auditEventCatalog[parsedInput.eventType];
    const actorId = "id" in parsedInput.actor ? parsedInput.actor.id : null;
    const actorName = "name" in parsedInput.actor ? parsedInput.actor.name : null;
    const actorApiKeyId = "apiKeyId" in parsedInput.actor ? parsedInput.actor.apiKeyId ?? null : null;
    const actorApiKeyName = "apiKeyName" in parsedInput.actor ? parsedInput.actor.apiKeyName ?? null : null;

    if (!catalogEntry) {
        throw new Error(`Unknown audit event type: ${parsedInput.eventType}`);
    }

    const [createdEvent] = await db
        .insert(schemas.auditEvent)
        .values({
            eventType: parsedInput.eventType,
            category: catalogEntry.category,
            outcome: parsedInput.outcome,
            actorType: parsedInput.actor.type,
            actorId,
            actorName,
            actorApiKeyId,
            actorApiKeyName,
            organizationId: parsedInput.organization?.id ?? null,
            organizationName: parsedInput.organization?.name ?? null,
            targetType: parsedInput.target?.type ?? null,
            targetId: parsedInput.target?.id ?? null,
            targetName: parsedInput.target?.name ?? null,
            ipAddress: parsedInput.ipAddress ?? null,
            userAgent: parsedInput.userAgent ?? null,
            metadata: parsedInput.metadata ?? {},
        })
        .returning();

    return createdEvent;
}
