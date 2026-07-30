import type { AuditLogOutcome } from "@/db/services/audit-log";
import type { AuditLogsCurrentFilters } from "@/features/audit/audit-types";

export type AuditLogsSearchParams = Record<string, string | string[] | undefined>;

export type ParsedAuditLogsSearchParams = AuditLogsCurrentFilters & {
    page: number;
    pageSize: number;
    outcome?: AuditLogOutcome;
};

function getFirstParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePageSize(value: string | undefined) {
    const parsed = parsePositiveInt(value, 10);
    return [10, 20, 50].includes(parsed) ? parsed : 10;
}

function parseDate(value: string | undefined) {
    if (!value) return undefined;
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}

export function parseAuditLogsSearchParams(searchParams: AuditLogsSearchParams): ParsedAuditLogsSearchParams {
    const page = parsePositiveInt(getFirstParam(searchParams.page), 1);
    const pageSize = parsePageSize(getFirstParam(searchParams.pageSize));
    const dateFrom = parseDate(getFirstParam(searchParams.dateFrom));
    const dateTo = parseDate(getFirstParam(searchParams.dateTo));
    const category = getFirstParam(searchParams.category) || undefined;
    const eventType = getFirstParam(searchParams.eventType) || undefined;
    const outcomeParam = getFirstParam(searchParams.outcome);
    const outcome = outcomeParam && ["success", "failure", "denied"].includes(outcomeParam)
        ? (outcomeParam as AuditLogOutcome)
        : undefined;

    return {
        page,
        pageSize,
        dateFrom,
        dateTo,
        category,
        eventType,
        outcome,
    };
}
