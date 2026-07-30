"use client";

import { type PaginationState } from "@tanstack/react-table";
import { usePathname, useRouter } from "next/navigation";

import { DataTable } from "@/components/common/data-table";
import type { AuditEvent } from "@/db/schema/18_audit-event";
import { auditLogColumns } from "@/features/audit/audit-log-columns";
import { AuditLogsFilters } from "@/features/audit/audit-logs-filters";
import type { AuditLogsCurrentFilters, AuditLogsFilterState, AuditLogsScope } from "@/features/audit/audit-types";

type AuditLogsListProps = {
    scope: AuditLogsScope;
    rows: AuditEvent[];
    total: number;
    page: number;
    pageSize: number;
    currentFilters: AuditLogsCurrentFilters;
};

export function AuditLogsList(props: AuditLogsListProps) {
    const router = useRouter();
    const pathname = usePathname();

    const filters: AuditLogsFilterState = {
        page: props.page,
        pageSize: props.pageSize,
        ...props.currentFilters,
    };

    const updateUrl = (nextPagination: PaginationState) => {
        const params = new URLSearchParams();
        params.set("page", String(nextPagination.pageIndex + 1));
        params.set("pageSize", String(nextPagination.pageSize));

        if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
        if (filters.dateTo) params.set("dateTo", filters.dateTo);
        if (filters.category) params.set("category", filters.category);
        if (filters.eventType) params.set("eventType", filters.eventType);
        if (filters.outcome) params.set("outcome", filters.outcome);

        router.replace(`${pathname}?${params.toString()}`);
    };

    const hasActiveFilters = Boolean(
        filters.dateFrom || filters.dateTo || filters.category || filters.eventType || filters.outcome,
    );

    return (
        <DataTable
            columns={auditLogColumns(props.scope)}
            data={props.rows}
            enableSelect={false}
            enablePagination
            paginationOptions={{ pageSize: [10, 20, 50], pageVisible: 3 }}
            manualPagination
            rowCount={props.total}
            paginationState={{
                pageIndex: Math.max(0, props.page - 1),
                pageSize: props.pageSize,
            }}
            onPaginationChange={(updater) => {
                const currentState: PaginationState = {
                    pageIndex: Math.max(0, props.page - 1),
                    pageSize: props.pageSize,
                };
                const nextState = typeof updater === "function" ? updater(currentState) : updater;

                if (nextState.pageSize !== currentState.pageSize) {
                    updateUrl({ pageIndex: 0, pageSize: nextState.pageSize });
                    return;
                }

                updateUrl(nextState);
            }}
            toolbar={<AuditLogsFilters filters={filters} />}
            emptyState={
                <div className="flex items-center justify-center py-12 text-base font-medium">
                    {hasActiveFilters ? "No audit logs match the current filters." : "No audit logs yet."}
                </div>
            }
        />
    );
}
