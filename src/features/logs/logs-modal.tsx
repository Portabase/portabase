"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useLogsModal } from "@/features/logs/logs-modal-context"
import { JobLog } from "@/db/schema/17_job-log"
import { LogRow } from "@/features/logs/log-row-modal"

export const LogsModal = () => {
    const { open, logs, closeModal } = useLogsModal()

    return (
        <Dialog open={open} onOpenChange={closeModal}>
            <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden border-border p-0 sm:max-w-6xl">
                <DialogHeader className="shrink-0 border-b border-border px-6 py-5">
                    <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                        Job Logs
                    </DialogTitle>
                </DialogHeader>

                <div className="hidden shrink-0 items-center gap-4 border-b border-border bg-card py-3 pl-6 pr-4 sm:flex">
                    <span className="w-[130px] text-sm font-semibold text-foreground">Date</span>
                    <span className="w-[90px] text-sm font-semibold text-foreground">Type</span>
                    <span className="flex-1 text-sm font-semibold text-foreground">Message</span>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div>
                        {logs.map((entry: JobLog) => (
                            <LogRow key={entry.id} entry={entry} />
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
