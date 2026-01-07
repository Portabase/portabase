"use client";

import {useEffect, useRef} from "react";
import {useRouter} from "next/navigation";

type UseAutoRefreshOptions = {
    poll?: {
        intervalMs: number;
        enabled?: boolean;
    };
    sse?: {
        url: string;
        eventName?: string;
        enabled?: boolean;
        shouldRefresh?: (data: unknown) => boolean;
    };
};

export function useAutoRefresh(options: UseAutoRefreshOptions) {
    const router = useRouter();
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        if (!options.poll?.enabled) return;
        if (!options.poll.intervalMs) return;

        const interval = setInterval(() => {
            router.refresh();
        }, options.poll.intervalMs);

        return () => clearInterval(interval);
    }, [options.poll?.enabled, options.poll?.intervalMs, router]);

    useEffect(() => {
        if (!options.sse?.enabled) return;
        if (!options.sse.url) return;

        const eventSource = new EventSource(options.sse.url);
        eventSourceRef.current = eventSource;

        const eventName = options.sse.eventName ?? "message";

        eventSource.addEventListener(eventName, (event: MessageEvent) => {
            let payload: unknown = event.data;

            try {
                payload = JSON.parse(event.data);
            } catch {}

            const shouldRefresh =
                options.sse?.shouldRefresh?.(payload) ?? true;

            if (shouldRefresh) {
                router.refresh();
            }
        });

        return () => {
            eventSource.close();
            eventSourceRef.current = null;
        };
    }, [
        options.sse?.enabled,
        options.sse?.url,
        options.sse?.eventName,
        router,
    ]);
}
