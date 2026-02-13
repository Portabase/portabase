"use client";
import { Clock9 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CronInput } from "@/components/wrappers/dashboard/database/cron-button/cron-input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateDatabaseBackupPolicyAction } from "@/components/wrappers/dashboard/database/cron-button/cron.action";
import {Database} from "@/db/schema/07_database";

export type CronButtonProps = {
    database: Database;
};

export const CronButton = (props: CronButtonProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isSwitched, setIsSwitched] = useState(props.database.backupPolicy !== null);
    const [open, setOpen] = useState(false);

    const updateDatabaseBackupPolicy = useMutation({
        mutationFn: (value: string) =>
            updateDatabaseBackupPolicyAction({ databaseId: props.database.id, backupPolicy: value }),
        onSuccess: () => {
            toast.success(`Method updated successfully.`);
            queryClient.invalidateQueries({ queryKey: ["database-data", props.database.id] });
            router.refresh();
        },
        onError: () => {
            toast.error(`An error occurred while updating backup method.`);
        },
    });

    const handleTypeChange = async (state: boolean) => {
        setIsSwitched(state);
        if (!state) {
            await updateDatabaseBackupPolicy.mutateAsync("");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" {...props} onClick={() => setOpen(true)}>
                    <Clock9 />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Backup method</DialogTitle>
                    <DialogDescription>Your settings for the backup method</DialogDescription>
                </DialogHeader>
                <Separator />

                <h1>Select your backup method</h1>
                <div className="flex items-center space-x-2">
                    <Label>Manual / Automatic </Label>
                    <Switch
                        checked={isSwitched}
                        onCheckedChange={async () => {
                            await handleTypeChange(!isSwitched);
                        }}
                        id="type-mode"
                    />
                </div>
                {isSwitched ? (
                    <CronInput
                        database={props.database}
                        onSuccess={() => {
                            setOpen(false);
                        }}
                    />
                ) : null}
            </DialogContent>
        </Dialog>
    );
};
