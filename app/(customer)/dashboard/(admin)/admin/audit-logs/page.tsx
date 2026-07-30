import { Metadata } from "next";

import { getAuditEventsPage } from "@/db/services/audit-log";
import { parseAuditLogsSearchParams } from "@/features/audit/audit-search-params";
import { AuditLogsList } from "@/features/audit/audit-logs-list";
import { Page, PageContent, PageHeader, PageTitle } from "@/features/layout/page";

export const metadata: Metadata = {
    title: "Audit Logs",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function RoutePage(props: { searchParams: SearchParams }) {
    const searchParams = parseAuditLogsSearchParams(await props.searchParams);
    const { page, pageSize, dateFrom, dateTo, category, eventType, outcome } = searchParams;

    const result = await getAuditEventsPage({
        page,
        pageSize,
        dateFrom,
        dateTo,
        category,
        eventType,
        outcome,
    });

    return (
        <Page>
            <PageHeader>
                <PageTitle>Audit Logs</PageTitle>
            </PageHeader>
            <PageContent>
                <AuditLogsList
                    scope="admin"
                    rows={result.rows}
                    total={result.total}
                    page={result.page}
                    pageSize={result.pageSize}
                    currentFilters={{
                        dateFrom,
                        dateTo,
                        category,
                        eventType,
                        outcome,
                    }}
                />
            </PageContent>
        </Page>
    );
}
