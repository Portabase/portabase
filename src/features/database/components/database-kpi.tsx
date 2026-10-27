"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {formatDateLastContact} from "@/utils/date-formatting";
import {Database} from "@/db/schema/07_database";
import {DatabaseBackup, Server, CheckCircle, Clock} from "lucide-react";
import type {BackupEngine} from "@/features/database/utils/backup-method";

export type DatabaseKpiPro = {
    successRate: any;
    database: Database;
    totalBackups: number;
    availableBackups: number;
};

const RUN_NOUNS: Partial<Record<BackupEngine, [string, string]>> = {sync: ["Sync", "Syncs"], copy: ["Copy", "Copies"]};

export const DatabaseKpi = (props: DatabaseKpiPro) => {
    const [noun, nouns] = RUN_NOUNS[props.database.backupEngine] ?? ["Backup", "Backups"];
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between gap-8 mb-6">
            <Card className="w-full sm:w-auto flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available {nouns}</CardTitle>
                    <DatabaseBackup className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{props.availableBackups}</div>
                    <p className="text-xs text-muted-foreground">{nouns} currently available</p>
                </CardContent>
            </Card>
            <Card className="w-full sm:w-auto flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total {nouns}</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{props.totalBackups}</div>
                    <p className="text-xs text-muted-foreground">Total {nouns.toLowerCase()} recorded</p>
                </CardContent>
            </Card>
            <Card className="w-full sm:w-auto flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {typeof props.successRate === 'number' ? `${props.successRate.toFixed(0)} %` : "Unavailable"}
                    </div>
                    <p className="text-xs text-muted-foreground">{noun} success rate</p>
                </CardContent>
            </Card>
            <Card className="w-full sm:w-auto flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Last Contact</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {formatDateLastContact(props.database.lastContact)}
                    </div>
                    <p className="text-xs text-muted-foreground">Time of last backup contact</p>
                </CardContent>
            </Card>
        </div>
    );
};
