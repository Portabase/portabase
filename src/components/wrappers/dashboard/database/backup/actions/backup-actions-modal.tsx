"use client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {Separator} from "@/components/ui/separator";
import {BackupActionsForm} from "@/components/wrappers/dashboard/database/backup/actions/backup-actions-form";
import {
    getBackupActionTextBasedOnActionKind,
    useBackupModal
} from "@/components/wrappers/dashboard/database/backup/backup-modal-context";


type DatabaseActionsModalProps = {}


export const DatabaseBackupActionsModal = ({}: DatabaseActionsModalProps) => {
    const {open, action, backup, closeModal} = useBackupModal();
    if (!backup || !action) return null;
    const text = getBackupActionTextBasedOnActionKind(action);

    return (
        <Dialog open={open} onOpenChange={closeModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{text} storage backup ?</DialogTitle>
                    <DialogDescription>
                        Select the backup storage you want to {text.toLowerCase()}
                    </DialogDescription>
                    <Separator className="mt-3 mb-3"/>
                </DialogHeader>
                <BackupActionsForm backup={backup} action={action}/>
            </DialogContent>
        </Dialog>
    )
}