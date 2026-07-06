import {FileText} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useLogsModal} from "@/features/logs/components/logs-modal-context";
import {fetchJobLogsAction} from "@/features/logs/actions/job-logs.action";

export type LogsModalTriggerProps = {
    backupId?: string;
    restorationId?: string;
}

export const LogsModalTrigger = ({backupId, restorationId}: LogsModalTriggerProps) => {
    const {openModal} = useLogsModal();
    return (
        <Button variant="outline" size="sm" onClick={() => {
            openModal(async () => {
                const result = await fetchJobLogsAction({backupId, restorationId});
                return result?.data ?? [];
            });
        }}>
            <FileText/>
        </Button>
    );
};
