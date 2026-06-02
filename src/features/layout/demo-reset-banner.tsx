'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

function getSecondsUntilNextHour(): number {
    const now = new Date();
    const s = 3600 - (now.getMinutes() * 60 + now.getSeconds());
    return s === 3600 ? 0 : s;
}

function formatTime(seconds: number): string {
    const s = Math.max(0, seconds);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function DemoResetBanner() {
    const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

    useEffect(() => {
        const tick = () => setSecondsLeft(getSecondsUntilNextHour());

        const timeout = setTimeout(tick, 0);
        const interval = setInterval(tick, 1000);

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, []);

    if (secondsLeft === null) return null;

    const isResetting = secondsLeft === 0;
    const isWarning = secondsLeft > 0 && secondsLeft <= 300;

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
