"use client";

import {createContext, useContext, useState, ReactNode} from "react";
import {JobLog} from "@/db/schema/17_job-log";

type LogsModalContextType = {
    open: boolean;
    logs: JobLog[];
    isLoading: boolean;
    openModal: (loader: () => Promise<JobLog[]>) => void;
    closeModal: () => void;
};

const LogsModalContext = createContext<LogsModalContextType | undefined>(undefined);

export const LogsModalProvider = ({children}: { children: ReactNode }) => {
    const [open, setOpen] = useState(false);
    const [logs, setLogs] = useState<JobLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const openModal = (loader: () => Promise<JobLog[]>) => {
        setLogs([]);
        setIsLoading(true);
        setOpen(true);
        loader()
            .then((result) => setLogs(result ?? []))
            .catch(() => setLogs([]))
            .finally(() => setIsLoading(false));
    };

    const closeModal = () => {
        setOpen(false);
        setLogs([]);
        setIsLoading(false);
    };

    return (
        <LogsModalContext.Provider value={{open, logs, isLoading, openModal, closeModal}}>
            {children}
        </LogsModalContext.Provider>
    );
};

export const useLogsModal = () => {
    const context = useContext(LogsModalContext);
    if (!context) throw new Error("useLogsModal must be used within LogsModalProvider");
    return context;
};
