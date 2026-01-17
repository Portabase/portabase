"use client";

import {BackupWith} from "@/db/schema/07_database";
import {useBackupModal} from "@/components/wrappers/dashboard/database/backup/backup-modal-context";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {MoreHorizontal, Trash2, Download} from "lucide-react";
import {ReloadIcon} from "@radix-ui/react-icons";
import {cn} from "@/lib/utils";
import {MemberWithUser} from "@/db/schema/03_organization";
import {useMutation} from "@tanstack/react-query";
import {deleteBackupAction} from "@/features/dashboard/restore/restore.action";
import {toast} from "sonner";

interface DatabaseActionsCellProps {
    backup: BackupWith;
    activeMember: MemberWithUser;
}

export function DatabaseActionsCell({backup, activeMember}: DatabaseActionsCellProps) {
    const {openModal} = useBackupModal();


    if (backup.deletedAt || activeMember.role === "member") return null;


    return (
        <div className={cn("flex items-center space-x-2")}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="w-4 h-4"/>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => openModal("restore", backup)}>
                        <ReloadIcon/> Restore
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => openModal("download", backup)}>
                        <Download/> Download
                    </DropdownMenuItem>
                    <DropdownMenuSeparator/>
                    <DropdownMenuItem onSelect={() => openModal("delete", backup)} className="text-red-600">
                        <Trash2/> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

    );
}

