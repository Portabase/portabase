"use client";

import {useState} from "react";
import {Loader2} from "lucide-react";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import type {RestorePreviewRow} from "@/features/database/actions/bulk-restore.action";
import {formatLocalizedDate} from "@/utils/date-formatting";

const CONFIRM_WORD = "restore";

export type BulkRestoreModalProps = {
    open: boolean;
    loading: boolean;
    submitting: boolean;
    rows: RestorePreviewRow[];
    onConfirm: () => void;
    onCancel: () => void;
};

export const BulkRestoreModal = (props: BulkRestoreModalProps) => {
    const {open, loading, submitting, rows, onConfirm, onCancel} = props;
    const [typed, setTyped] = useState("");

    const restorableCount = rows.filter((r) => r.restorable).length;
    const canConfirm = restorableCount > 0 && typed.trim().toLowerCase() === CONFIRM_WORD && !submitting;

    return (
        <Dialog open={open} onOpenChange={(o) => (!o ? onCancel() : undefined)}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Restore {rows.length} database(s) to latest backup
                    </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    This overwrites current data and cannot be undone.
                </p>

                {loading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="max-h-64 overflow-auto rounded-md border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-muted-foreground border-b">
                                    <th className="p-2">Database</th>
                                    <th className="p-2">Will restore from</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r) => (
                                    <tr key={r.databaseId} className="border-b last:border-0">
                                        <td className={`p-2 ${r.restorable ? "" : "opacity-50"}`}>{r.name}</td>
                                        <td className="p-2">
                                            {r.restorable
                                                ? <span className="text-green-600">{r.backupDate ? formatLocalizedDate(r.backupDate) : "latest backup"}</span>
                                                : <span className="text-amber-500">{r.reason ?? "no successful backup"} — skipped</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {restorableCount > 0 && (
                    <div className="space-y-1">
                        <label className="text-xs text-muted-foreground">Type &quot;{CONFIRM_WORD}&quot; to confirm</label>
                        <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={CONFIRM_WORD} />
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={submitting}>Cancel</Button>
                    <Button  onClick={onConfirm} disabled={!canConfirm}>
                        {submitting && <Loader2 className="animate-spin" />}
                        {restorableCount > 0 ? `Restore ${restorableCount} database(s)` : "Nothing to restore"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
