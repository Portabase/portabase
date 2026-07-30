"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auditCategories, auditEventTypes, auditOutcomeOptions } from "@/features/audit/catalog";
import type { AuditLogsFilterState } from "@/features/audit/audit-types";

type AuditLogsFiltersProps = {
    filters: AuditLogsFilterState;
};

export function AuditLogsFilters({ filters }: AuditLogsFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [dateFrom, setDateFrom] = useState(filters.dateFrom ?? "");
    const [dateTo, setDateTo] = useState(filters.dateTo ?? "");

    useEffect(() => {
        setDateFrom(filters.dateFrom ?? "");
        setDateTo(filters.dateTo ?? "");
    }, [filters.dateFrom, filters.dateTo]);

    const updateUrl = (next: Partial<AuditLogsFilterState>) => {
        const params = new URLSearchParams();
        const merged: AuditLogsFilterState = {
            ...filters,
            ...next,
        };

        const page = next.page ?? 1;
        params.set("page", String(page));
        params.set("pageSize", String(merged.pageSize));

        if (merged.dateFrom) params.set("dateFrom", merged.dateFrom);
        if (merged.dateTo) params.set("dateTo", merged.dateTo);
        if (merged.category) params.set("category", merged.category);
        if (merged.eventType) params.set("eventType", merged.eventType);
        if (merged.outcome) params.set("outcome", merged.outcome);

        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    };

    return (
        <div className="flex w-full flex-wrap items-end gap-3">
            <div className="grid gap-2">
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Date from</label>
                <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => {
                        const value = event.target.value;
                        setDateFrom(value);
                        updateUrl({ dateFrom: value || undefined, page: 1 });
                    }}
                    className="w-[180px]"
                />
            </div>

            <div className="grid gap-2">
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Date to</label>
                <Input
                    type="date"
                    value={dateTo}
                    onChange={(event) => {
                        const value = event.target.value;
                        setDateTo(value);
                        updateUrl({ dateTo: value || undefined, page: 1 });
                    }}
                    className="w-[180px]"
                />
            </div>

            <div className="grid gap-2">
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Category</label>
                <Select
                    value={filters.category ?? "all"}
                    onValueChange={(value) => updateUrl({ category: value === "all" ? undefined : value, page: 1 })}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">all</SelectItem>
                        {auditCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Event type</label>
                <Select
                    value={filters.eventType ?? "all"}
                    onValueChange={(value) => updateUrl({ eventType: value === "all" ? undefined : value, page: 1 })}
                >
                    <SelectTrigger className="w-[260px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">all</SelectItem>
                        {auditEventTypes.map((eventType) => (
                            <SelectItem key={eventType} value={eventType}>
                                {eventType}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <label className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Outcome</label>
                <Select
                    value={filters.outcome ?? "all"}
                    onValueChange={(value) => updateUrl({ outcome: value === "all" ? undefined : value, page: 1 })}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">all</SelectItem>
                        {auditOutcomeOptions.map((outcome) => (
                            <SelectItem key={outcome} value={outcome}>
                                {outcome}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Button
                variant="ghost"
                disabled={isPending}
                onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    updateUrl({
                        page: 1,
                        pageSize: filters.pageSize,
                        dateFrom: undefined,
                        dateTo: undefined,
                        category: undefined,
                        eventType: undefined,
                        outcome: undefined,
                    });
                }}
            >
                Reset filters
            </Button>
        </div>
    );
}
