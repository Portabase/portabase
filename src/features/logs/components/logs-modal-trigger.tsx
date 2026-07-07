import {FileText, Loader2} from "lucide-react";
import {useState} from "react";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {useLogsModal} from "@/features/logs/components/logs-modal-context";
import {fetchJobLogsAction} from "@/features/logs/actions/job-logs.action";

export type LogsModalTriggerProps = {
    backupId?: string;
    restorationId?: string;
    hasLogs?: boolean;
}

export const LogsModalTrigger = ({backupId, restorationId, hasLogs}: LogsModalTriggerProps) => {
    const {openModal} = useLogsModal();
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        setIsLoading(true);
        try {
            const result = await fetchJobLogsAction({backupId, restorationId});
            openModal(result?.data ?? []);
        } catch {
            toast.error("Failed to load logs.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button disabled={!hasLogs || isLoading} variant="outline" size="sm" onClick={handleClick}>
            {isLoading ? <Loader2 className="animate-spin"/> : <FileText/>}
        </Button>
    );
};
