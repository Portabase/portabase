import {FileText} from "lucide-react";
import {JobLog} from "@/db/schema/17_job-log";
import {Button} from "@/components/ui/button";
import {useLogsModal} from "@/features/logs/logs-modal-context";

export type LogsModalTriggerProps = {
    logs: JobLog[]
}

export const LogsModalTrigger = ({logs}: LogsModalTriggerProps) => {
    const {openModal} = useLogsModal();
    return (
        <Button disabled={logs.length == 0} variant="outline" size="sm" onClick={()=> {
            openModal(logs);
        }}>
            <FileText />
        </Button>
    )
}