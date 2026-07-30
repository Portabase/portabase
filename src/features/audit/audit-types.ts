export type AuditLogsScope = "admin" | "organization";

export type AuditLogsFilterState = {
    page: number;
    pageSize: number;
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    eventType?: string;
    outcome?: string;
};

export type AuditLogsCurrentFilters = Omit<AuditLogsFilterState, "page" | "pageSize">;
