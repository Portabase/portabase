import { NextRequest, NextResponse } from 'next/server';

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = typeof LOG_LEVELS[number];

const raw = (process.env.LOG_LEVEL ?? "info") as LogLevel;
const _idx = LOG_LEVELS.indexOf(raw);
const LEVEL_INDEX = _idx === -1 ? 1 : _idx;

const STATUS_PATH_RE = /\/api\/agent\/[^/]+\/status\/?$/;

export function loggingMiddleware(request: NextRequest) {
    if (request.url.includes('/api')) {
        const isStatusPing = STATUS_PATH_RE.test(request.nextUrl.pathname);
        // Status pings are debug-level; all other API calls are info-level.
        const requiredIndex = isStatusPing ? 0 : 1;
        if (LEVEL_INDEX <= requiredIndex) {
            console.log(`[API] Received ${request.method} request : ${request.url} at ${new Date()}`);
        }
    }
    return NextResponse.next();
}