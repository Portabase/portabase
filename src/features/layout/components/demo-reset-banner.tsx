'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function getSecondsUntilNextReset(intervalMinutes: number): number {
    const intervalSec = intervalMinutes * 60;
    const remainder = Math.floor(Date.now() / 1000) % intervalSec;
    return remainder === 0 ? 0 : intervalSec - remainder;
}

function formatTime(seconds: number): string {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function DemoResetBanner({ intervalMinutes = 60 }: { intervalMinutes?: number }) {
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    useEffect(() => {
        const tick = () => setSecondsLeft(getSecondsUntilNextReset(intervalMinutes));

        const timeout = setTimeout(tick, 0);
        const interval = setInterval(tick, 1000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [intervalMinutes]);

    if (secondsLeft === null) return null;

    const warnThreshold = Math.min(300, intervalMinutes * 60 * 0.1);
    const isResetting = secondsLeft === 0;
    const isWarning = secondsLeft > 0 && secondsLeft <= warnThreshold;

    return (
        <Badge
            variant="outline"
            className={cn(
                'hidden md:inline-flex h-7',
                isResetting && 'animate-pulse border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
                isWarning && 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
            )}
        >
            <Timer aria-hidden="true" />
            {isResetting ? 'Resetting…' : `Demo resets in ${formatTime(secondsLeft)}`}
        </Badge>
    );
}
