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
import {TooltipCustom} from "@/components/wrappers/common/tooltip-custom";

interface DatabaseActionsCellProps {
    backup: BackupWith;
    activeMember: MemberWithUser;
    isAlreadyRestore: boolean;
}

export function DatabaseActionsCell({backup, activeMember, isAlreadyRestore}: DatabaseActionsCellProps) {
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

                    {backup.status == "success" ? (
                        <>
                            <TooltipCustom disabled={isAlreadyRestore}
                                           text="Already a restoration waiting">
                                <DropdownMenuItem
                                    disabled={isAlreadyRestore}
                                    onSelect={() => openModal("restore", backup)}
                                >
                                    <ReloadIcon/> Restore
                                </DropdownMenuItem>
                            </TooltipCustom>
                            <DropdownMenuItem
                                onSelect={() => openModal("download", backup)}
                            >
                                <Download/> Download
                            </DropdownMenuItem>
                        </>
                    ) : null}

                    <DropdownMenuSeparator/>
                    <DropdownMenuItem onSelect={() => openModal("delete", backup)} className="text-red-600">
                        <Trash2/> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

    );
}

