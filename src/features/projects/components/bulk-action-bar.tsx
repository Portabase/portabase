"use client";

import {DatabaseZap, RotateCcw, X, Loader2} from "lucide-react";
import {Button} from "@/components/ui/button";

export type BulkActionBarProps = {
    count: number;
    isPending: boolean;
    onBackup: () => void;
    onRestore: () => void;
    onClear: () => void;
};

export const BulkActionBar = ({count, isPending, onBackup, onRestore, onClear}: BulkActionBarProps) => {
    if (count === 0) return null;
    return (
        <div
            className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 sm:gap-3 rounded-xl border border-primary/50 bg-card shadow-lg px-3 sm:px-4 py-2 sm:py-3 max-w-[calc(100vw-1.5rem)]">
            <span className="flex-shrink-0 rounded-full bg-primary text-primary-foreground text-xs font-bold px-2.5 sm:px-3 py-1">
                {count}
                <span className="hidden sm:inline"> selected</span>
            </span>
            <Button size="sm" variant="outline" onClick={onBackup} disabled={isPending} title="Backup">
                {isPending ? <Loader2 className="animate-spin"/> : <DatabaseZap/>}
                <span className="hidden sm:inline">Backup</span>
            </Button>
            <Button size="sm" variant="outline" onClick={onRestore} disabled={isPending} title="Restore latest">
                <RotateCcw/>
                <span className="hidden sm:inline">Restore latest</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={onClear} disabled={isPending} title="Clear">
                <X/>
                <span className="hidden sm:inline">Clear</span>
            </Button>
        </div>
    );
};
