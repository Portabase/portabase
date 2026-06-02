'use client';

import { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

function getSecondsUntilNextHour(): number {
    const now = new Date();
    return 3600 - (now.getMinutes() * 60 + now.getSeconds());
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
        setSecondsLeft(getSecondsUntilNextHour());

        const interval = setInterval(() => {
            setSecondsLeft(getSecondsUntilNextHour());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    if (secondsLeft === null) return null;

    const isResetting = secondsLeft === 0;
    const isWarning = secondsLeft > 0 && secondsLeft <= 300;

    return (
        <span
            className={cn(
                'hidden md:inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium',
                isResetting && 'animate-pulse border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400',
                isWarning && 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
                !isResetting && !isWarning && 'border-input bg-background text-muted-foreground',
            )}
        >
            <Timer className="size-3 shrink-0" aria-hidden="true" />
            {isResetting ? 'Resetting…' : `Resets in ${formatTime(secondsLeft)}`}
        </span>
    );
}
