import {
    auditEventEnrichmentSchema, type AuditEventEnrichment, type WithAuditEventConfigBase, withAuditEventConfigSchema,
} from "@/lib/audit/schema";
import {createAuditEvent} from "@/lib/audit/create-audit-event";


type WithAuditEventCallback<TResult> = (value: TResult | unknown) => AuditEventEnrichment | void;
type WithAuditEventResult = { success: boolean };

export type WithAuditEventConfig<TResult extends WithAuditEventResult> = WithAuditEventConfigBase & {
    onSuccess?: (result: TResult) => AuditEventEnrichment | void;
    onFailure?: WithAuditEventCallback<TResult>;
};

export async function withAuditEvent<TResult extends WithAuditEventResult>(
    effect: () => Promise<TResult>,
    config: WithAuditEventConfig<TResult>,
) {
    const {onSuccess, onFailure, ...rawConfig} = config;
    const parsedConfig = withAuditEventConfigSchema.parse(rawConfig);

    const writeOutcome = async (
        outcome: "success" | "failure" | "denied",
        enrichmentValue: AuditEventEnrichment | void,
    ) => {
        const enrichment = enrichmentValue ? auditEventEnrichmentSchema.parse(enrichmentValue) : {};

        await createAuditEvent({
            eventType: parsedConfig.eventType,
            outcome,
            actor: parsedConfig.actor,
            organization: enrichment?.organization === undefined ? parsedConfig.organization ?? null : enrichment.organization ?? null,
            target: enrichment?.target === undefined ? parsedConfig.target ?? null : enrichment.target ?? null,
            ipAddress: parsedConfig.ipAddress ?? null,
            userAgent: parsedConfig.userAgent ?? null,
            metadata: {...parsedConfig.metadata, ...enrichment.metadata},
        });
    };

    try {
        const result = await effect();

        if (!result.success) {
            await writeOutcome("failure", onFailure?.(result));
            return result;
        }

        await writeOutcome("success", onSuccess?.(result));
        return result;

    } catch (error) {
        await writeOutcome("failure", onFailure?.(error));

        throw error;
    }
}
