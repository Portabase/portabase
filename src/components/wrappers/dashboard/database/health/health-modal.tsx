"use client"

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {DatabaseWith} from "@/db/schema/07_database";
import {HeartPulse} from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";
import {HealthcheckLog} from "@/db/schema/15_healthcheck-log";
import {HealthCheckGraph} from "@/components/wrappers/dashboard/health/heath-grid";

type HealthModalProps = {
    database: DatabaseWith,
    healthLogs: HealthcheckLog[]
}

export const HealthModal = ({database, healthLogs}: HealthModalProps) => {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(true)}>
                    <HeartPulse/>
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
                <div className="flex  pl-5 pt-4">
                    <SheetTitle>
                        Database Health Status
                    </SheetTitle>
                </div>
                <div className="px-4 pb-5">
                    <HealthCheckGraph logs={healthLogs} />
                </div>
            </SheetContent>
        </Sheet>
    )
}