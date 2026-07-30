import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import { auditEvent } from "@/db/schema/18_audit-event";

export type AuditLogOutcome = "success" | "failure" | "denied";

export type AuditLogPageInput = {
    page: number;
    pageSize: number;
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    eventType?: string;
    outcome?: AuditLogOutcome;
    organizationId?: string;
};

export type AuditLogPageResult = {
    rows: typeof auditEvent.$inferSelect[];
    total: number;
    page: number;
    pageSize: number;
};

function toStartOfDay(value?: string) {
    if (!value) return undefined;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return undefined;

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
}

function toEndOfDay(value?: string) {
    if (!value) return undefined;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return undefined;

    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day), 23, 59, 59, 999);
}

export async function getAuditEventsPage(input: AuditLogPageInput): Promise<AuditLogPageResult> {
    const where = [];
    const dateFrom = toStartOfDay(input.dateFrom);
    const dateTo = toEndOfDay(input.dateTo);

    if (input.organizationId) where.push(eq(auditEvent.organizationId, input.organizationId));
    if (input.category) where.push(eq(auditEvent.category, input.category));
    if (input.eventType) where.push(eq(auditEvent.eventType, input.eventType));
    if (input.outcome) where.push(eq(auditEvent.outcome, input.outcome));
    if (dateFrom) where.push(gte(auditEvent.createdAt, dateFrom));
    if (dateTo) where.push(lte(auditEvent.createdAt, dateTo));

    const page = Math.max(1, input.page);
    const pageSize = Math.max(1, input.pageSize);
    const offset = (page - 1) * pageSize;
    const whereClause = where.length > 0 ? and(...where) : undefined;

    const [totalRow] = await db
        .select({ count: count() })
        .from(auditEvent)
        .where(whereClause);

    const rows = await db
        .select()
        .from(auditEvent)
        .where(whereClause)
        .orderBy(desc(auditEvent.createdAt))
        .limit(pageSize)
        .offset(offset);

    return {
        rows,
        total: totalRow?.count ?? 0,
        page,
        pageSize,
    };
}
