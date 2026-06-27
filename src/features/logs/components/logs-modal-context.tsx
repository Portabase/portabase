"use client";

import {createContext, useContext, useState, ReactNode} from "react";
import {JobLog} from "@/db/schema/17_job-log";

type LogsModalContextType = {
    open: boolean;
    logs: JobLog[];
    openModal: (logs: JobLog[]) => void;
    closeModal: () => void;
};

const LogsModalContext = createContext<LogsModalContextType | undefined>(undefined);

export const LogsModalProvider = ({children}: { children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [logs, setLogs] = useState<JobLog[]>([]);

    const openModal = (newLogs: JobLog[]) => {
        setLogs(newLogs);
        setOpen(true);
    };

    const closeModal = () => {
        setOpen(false);
        setLogs([]);
    };

    return (
        <LogsModalContext.Provider value={{open, logs, openModal, closeModal}}>
            {children}
        </LogsModalContext.Provider>
    );
};

export const useLogsModal = () => {
    const context = useContext(LogsModalContext);
    if (!context) throw new Error("useLogsModal must be used within LogsModalProvider");
    return context;
};
