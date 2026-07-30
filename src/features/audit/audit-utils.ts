import { type AuditEvent } from "@/db/schema/18_audit-event";

const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const LOCALE = Intl.DateTimeFormat().resolvedOptions().locale;

export function formatAuditDateTime(date: string | number | Date) {
    return new Intl.DateTimeFormat(LOCALE, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: TIMEZONE,
    }).format(new Date(date));
}

export function formatAuditActor(event: AuditEvent) {
    const actorLabel = event.actorName ?? event.actorId ?? "Unknown";
    return `${event.actorType} (${actorLabel})`;
}

export function getOutcomeBadgeClass(outcome: AuditEvent["outcome"]) {
    switch (outcome) {
        case "success":
            return "bg-green-100 text-green-800 border-green-200";
        case "failure":
            return "bg-red-100 text-red-800 border-red-200";
        case "denied":
            return "bg-amber-100 text-amber-800 border-amber-200";
    }
}

export function hasMeaningfulMetadata(value: unknown) {
    return typeof value === "object" && value !== null && Object.keys(value as Record<string, unknown>).length > 0;
}
