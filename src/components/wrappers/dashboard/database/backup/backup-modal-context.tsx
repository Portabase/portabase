"use client";

import {createContext, useContext, useState, ReactNode} from "react";
import {BackupWith} from "@/db/schema/07_database";
import {useRouter} from "next/navigation";

export type DatabaseActionKind = "restore" | "download" | "delete";

export function getBackupActionTextBasedOnActionKind(kind: DatabaseActionKind) {
    switch (kind) {
        case "restore":
            return "Restore";
        case "download":
            return "Download";
        case "delete":
            return "Delete";
        default:
            return "Unknown";
    }
}


type BackupModalContextType = {
    open: boolean;
    action: DatabaseActionKind | null;
    backup: BackupWith | null;
    openModal: (action: DatabaseActionKind, backup: BackupWith) => void;
    closeModal: () => void;
};

const BackupModalContext = createContext<BackupModalContextType | undefined>(undefined);

export const BackupModalProvider = ({children}: { children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [action, setAction] = useState<DatabaseActionKind | null>(null);
    const [backup, setBackup] = useState<BackupWith | null>(null);

    const openModal = (newAction: DatabaseActionKind, newBackup: BackupWith) => {
        setAction(newAction);
        setBackup(newBackup);
        setOpen(true);
    };

    const closeModal = () => {
        setOpen(false);
        setAction(null);
        setBackup(null);
        router.refresh()
    };

    return (
        <BackupModalContext.Provider value={{open, action, backup, openModal, closeModal}}>
            {children}
        </BackupModalContext.Provider>
    );
};

export const useBackupModal = () => {
    const context = useContext(BackupModalContext);
    if (!context) throw new Error("useBackupModal must be used within BackupModalProvider");
    return context;
};
