"use client"

import {useState} from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {DatabaseWith} from "@/db/schema/07_database";
import {Separator} from "@/components/ui/separator";
import {Import} from "lucide-react";
import {UploadBackupZone} from "@/components/wrappers/dashboard/database/import/upload-backup-zone";

type ImportModalProps = {
    database: DatabaseWith;
}

export const ImportModal = ({database}: ImportModalProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(true)}>
                    <Import/>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Backup</DialogTitle>
                    <DialogDescription>
                        Import backup file of your choice.
                    </DialogDescription>
                    <Separator className="mt-3 "/>
                    <UploadBackupZone
                        onSuccessAction={() => setOpen(false)}
                        database={database}/>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    )
}