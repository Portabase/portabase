"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Database, Ruler } from "lucide-react";
import { DatabaseWith, RetentionPolicy } from "@/db/schema/07_database";
import { BackupRetentionSettingsForm } from "@/features/database/components/retention-policy-form";
import { RetentionSettings } from "@/features/database/schemas/retention-policy.schema";
import { updateOrCreateBackupRetentionPolicyAction } from "@/features/database/actions/retention-policy.action";

type RetentionPolicySheetProps = {
    database: DatabaseWith;
};

const toRetentionSettings = (rp: RetentionPolicy | undefined | null): RetentionSettings | undefined => {
    if (!rp) return undefined;
    return {
        type: rp.type,
        count: rp.count ?? 7,
        days: rp.days ?? 30,
        gfs: {
            daily: rp.gfsDaily ?? 7,
            weekly: rp.gfsWeekly ?? 4,
            monthly: rp.gfsMonthly ?? 12,
            yearly: rp.gfsYearly ?? 3,
        },
    };
};

export const RetentionPolicySheet = ({ database }: RetentionPolicySheetProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async (payload: RetentionSettings) =>
            updateOrCreateBackupRetentionPolicyAction({ databaseId: database.id, settings: payload }),
        onSuccess: () => {
            toast.success("Retention policy updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["database-data", database.id] });
            router.refresh();
        },
        onError: () => {
            toast.error("An error occurred while updating retention policy.");
        },
    });

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline">
                    <Ruler />
                </Button>
            </SheetTrigger>
            <SheetContent className="flex gap-4 p-4 w-full md:w-[800px] max-w-[800px] max-h-screen overflow-y-scroll">
                <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-balance">
                        <Database className="h-5 w-5" />
                        Backup Retention Policy
                    </SheetTitle>
                    <SheetDescription className="text-pretty">
                        Configure how long to keep your .dump backup files. Choose from simple count-based, time-based,
                        or enterprise GFS rotation strategies.
                    </SheetDescription>
                </SheetHeader>
                {database.backupPolicy !== null ? (
                    <BackupRetentionSettingsForm
                        defaultValues={toRetentionSettings(database.retentionPolicy as RetentionPolicy)}
                        currentType={database.retentionPolicy?.type}
                        isPending={mutation.isPending}
                        onSave={async (values) => { await mutation.mutateAsync(values); }}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-center py-12 gap-4 border rounded-lg">
                        <p className="text-muted-foreground">
                            No backup policy configured yet. Please configure one!
                        </p>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
