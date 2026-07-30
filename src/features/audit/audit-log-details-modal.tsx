"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { AuditEvent } from "@/db/schema/18_audit-event";
import type { AuditLogsScope } from "@/features/audit/audit-types";
import { formatAuditDateTime, hasMeaningfulMetadata } from "@/features/audit/audit-utils";

type AuditLogDetailsModalProps = {
    event: AuditEvent;
    scope: AuditLogsScope;
};

type DetailRow = {
    label: string;
    value: string | null | undefined;
    monospace?: boolean;
};

function DetailSection(props: { title: string; rows: DetailRow[] }) {
    const rows = props.rows.filter((row) => row.value !== null && row.value !== undefined && row.value !== "");

    if (rows.length === 0) return null;

    return (
        <section className="rounded-xl border bg-card p-4">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{props.title}</h3>
            <div className="grid gap-3">
                {rows.map((row) => (
                    <div key={`${props.title}-${row.label}`} className="grid gap-1 md:grid-cols-[140px_1fr] md:gap-4">
                        <div className="text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground">{row.label}</div>
                        <div className={row.monospace ? "break-all font-mono text-sm" : "break-words text-sm"}>{row.value}</div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export function AuditLogDetailsModal({ event, scope }: AuditLogDetailsModalProps) {
    const [open, setOpen] = useState(false);
    const metadataJson = useMemo(() => JSON.stringify(event.metadata ?? {}, null, 2), [event.metadata]);

    const actorRows: DetailRow[] = [
        { label: "Actor type", value: event.actorType },
        { label: "Actor id", value: event.actorId, monospace: true },
        { label: "Actor name", value: event.actorName },
    ];

    if (event.actorType === "api_key") {
        actorRows.push(
            { label: "API key id", value: event.actorApiKeyId, monospace: true },
            { label: "API key name", value: event.actorApiKeyName },
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Inspect audit log">
                    <Search className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{event.eventType}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <DetailSection
                            title="Event"
                            rows={[
                                { label: "Id", value: event.id, monospace: true },
                                { label: "Created at", value: formatAuditDateTime(event.createdAt) },
                                { label: "Event type", value: event.eventType, monospace: true },
                                { label: "Category", value: event.category },
                                { label: "Outcome", value: event.outcome },
                            ]}
                        />
                        <DetailSection title="Actor" rows={actorRows} />
                        {scope === "admin" ? (
                            <DetailSection
                                title="Organization"
                                rows={[
                                    { label: "Organization id", value: event.organizationId, monospace: true },
                                    { label: "Organization name", value: event.organizationName },
                                ]}
                            />
                        ) : null}
                        <DetailSection
                            title="Target"
                            rows={[
                                { label: "Target type", value: event.targetType },
                                { label: "Target id", value: event.targetId, monospace: true },
                                { label: "Target name", value: event.targetName },
                            ]}
                        />
                    </div>
                    <DetailSection
                        title="Request"
                        rows={[
                            { label: "IP address", value: event.ipAddress, monospace: true },
                            { label: "User agent", value: event.userAgent },
                        ]}
                    />
                    {hasMeaningfulMetadata(event.metadata) && (
                        <section className="rounded-xl border bg-card p-4">
                            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Metadata</h3>
                            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm leading-6">{metadataJson}</pre>
                        </section>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
