"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {formatDateLastContact} from "@/utils/date-formatting";
import {Database} from "@/db/schema/07_database";
import {DatabaseBackup, Server, CheckCircle, Clock} from "lucide-react";

export type DatabaseKpiPro = {
    successRate: any;
    database: Database;
    totalBackups: number;
    availableBackups: number;
};
export const DatabaseKpi = (props: DatabaseKpiPro) => {
    return (
        <div className="flex flex-col sm:flex-row sm:justify-between gap-8 mb-6">
            <Card className="w-full sm:w-auto flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Available Backups</CardTitle>
                    <DatabaseBackup className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{props.availableBackups}</div>
                    <p className="text-xs text-muted-foreground">Backups currently available</p>
                </CardContent>
            </Card>
            <Card className="w-full sm:w-auto flex-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Backups</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{props.totalBackups}</div>
                    <p className="text-xs text-muted-foreground">Total backups recorded</p>
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
                    <p className="text-xs text-muted-foreground">Backup success rate</p>
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
