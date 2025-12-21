import {formatDistanceToNow} from "date-fns";
import {format} from "date-fns";

/**
 * Get user's locale and timezone from the browser
 */
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const LOCALE = Intl.DateTimeFormat().resolvedOptions().locale;

/**
 * Format a date in DD/MM/YYYY HH:mm 24-hour format
 */
export function formatLocalizedDate(date: string | number | Date) {
    const d = new Date(date);
    return new Intl.DateTimeFormat(LOCALE, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false, // 24-hour format
        timeZone: TIMEZONE,
    }).format(d);
}

export function humanReadableDate(rawDate: string | number | Date) {
    return formatLocalizedDate(rawDate);
}

export function timeAgo(rawDate: string | number | Date) {
    const date = new Date(rawDate);
    return formatDistanceToNow(date, { addSuffix: true });
}

export function formatDateLastContact(lastContact: string | number | Date | null) {
    return lastContact
        ? formatLocalizedDate(lastContact)
        : "Never connected.";
}

