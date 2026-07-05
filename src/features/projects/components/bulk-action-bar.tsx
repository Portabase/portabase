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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-primary/50 bg-card shadow-lg px-4 py-3">
            <span className="rounded-full bg-primary text-primary-foreground text-xs font-bold px-3 py-1">
                {count} selected
            </span>
            <Button size="sm" onClick={onBackup} disabled={isPending}>
                {isPending ? <Loader2 className="animate-spin" /> : <DatabaseZap />} Backup
            </Button>
            <Button size="sm" variant="destructive" onClick={onRestore} disabled={isPending}>
                <RotateCcw /> Restore latest
            </Button>
            <Button size="sm" variant="ghost" onClick={onClear} disabled={isPending}>
                <X /> Clear
            </Button>
        </div>
    );
};
