"use client";

import {useMemo, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";

import {Database} from "@/db/schema/07_database";
import {DatabaseCard} from "@/components/common/database-card";
import {Button} from "@/components/ui/button";
import {PaginationNavigation} from "@/components/common/pagination-navigation";
import {PaginationSize} from "@/components/common/pagination-size";
import {BulkActionBar} from "@/features/projects/components/bulk-action-bar";
import {BulkRestoreModal} from "@/features/projects/components/bulk-restore-modal";
import {bulkBackupAction} from "@/features/database/actions/bulk-backup.action";
import {
    bulkRestorePreviewAction,
    bulkRestoreLatestAction,
    type RestorePreviewRow,
} from "@/features/database/actions/bulk-restore.action";

export type ProjectDatabaseSelectionProps = {
    projectId: string;
    databases: Database[];
};

export const ProjectDatabaseSelection = ({projectId, databases}: ProjectDatabaseSelectionProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [pageSize, setPageSize] = useState(20);
    const [currentPage, setCurrentPage] = useState(1);
    const [pending, setPending] = useState(false);

    const [restoreOpen, setRestoreOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewRows, setPreviewRows] = useState<RestorePreviewRow[]>([]);

    const sorted = useMemo(
        () => [...databases].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [databases],
    );
    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const pageItems = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const selectedIds = Array.from(selected);

    const toggle = (id: string) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });

    const selectAll = () => setSelected(new Set(sorted.map((d) => d.id)));
    const clear = () => setSelected(new Set());

    const afterQueue = () => {
        clear();
        queryClient.invalidateQueries({queryKey: ["database-data"]});
        router.refresh();
    };

    const handleBackup = async () => {
        setPending(true);
        const res = await bulkBackupAction({projectId, databaseIds: selectedIds});
        setPending(false);
        const data = res?.data;
        if (data?.success) {
            toast.success(data.actionSuccess?.message ?? "Backups queued.");
            afterQueue();
        } else {
            toast.error(res?.serverError ?? data?.actionError?.message ?? "Failed to queue backups.");
        }
    };

    const openRestore = async () => {
        setRestoreOpen(true);
        setPreviewLoading(true);
        const res = await bulkRestorePreviewAction({projectId, databaseIds: selectedIds});
        setPreviewLoading(false);
        if (res?.data?.success && res.data.value) {
            setPreviewRows(res.data.value);
        } else {
            toast.error(res?.serverError ?? "Failed to build preview.");
            setRestoreOpen(false);
        }
    };

    const confirmRestore = async () => {
        setPending(true);
        const res = await bulkRestoreLatestAction({projectId, databaseIds: selectedIds});
        setPending(false);
        setRestoreOpen(false);
        const data = res?.data;
        if (data?.success) {
            toast.success(data.actionSuccess?.message ?? "Restores queued.");
            afterQueue();
        } else {
            toast.error(res?.serverError ?? data?.actionError?.message ?? "Failed to queue restores.");
        }
    };

    return (
        <div className="flex flex-col h-full justify-between">
            <div>
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{selected.size} selected</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={selectAll}>Select all</Button>
                        <Button variant="ghost" size="sm" onClick={clear} disabled={selected.size === 0}>Clear</Button>
                    </div>
                </div>

                <div className="grid h-max auto-rows-min gap-4 md:grid-cols-3">
                    {pageItems.map((database) => (
                        <Link
                            key={database.id}
                            className="group block transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
                            href={`/dashboard/projects/${projectId}/database/${database.id}`}
                        >
                            <DatabaseCard
                                data={database}
                                selectable
                                selected={selected.has(database.id)}
                                onToggleSelect={toggle}
                            />
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-end mt-4 gap-4">
                <PaginationSize
                    pageSize={pageSize}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setCurrentPage(1);
                    }}
                    pageSizeOptions={[10, 20, 50]}
                />
                <PaginationNavigation
                    className="justify-end"
                    totalPages={totalPages}
                    currentPage={currentPage}
                    goToPage={setCurrentPage}
                    goToPrevPage={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    goToNextPage={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    maxVisiblePages={3}
                />
            </div>

            <BulkActionBar
                count={selected.size}
                isPending={pending}
                onBackup={handleBackup}
                onRestore={openRestore}
                onClear={clear}
            />

            <BulkRestoreModal
                open={restoreOpen}
                loading={previewLoading}
                submitting={pending}
                rows={previewRows}
                onConfirm={confirmRestore}
                onCancel={() => setRestoreOpen(false)}
            />
        </div>
    );
};
