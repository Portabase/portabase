"use client";
import { Clock9 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CronInput } from "@/features/database/components/cron-input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateBackupPolicyAction } from "@/features/database/actions/cron.action";
import { PolicyScope } from "@/features/database/schemas/policy-scope.schema";

export type CronButtonProps = {
    scope: PolicyScope;
    currentCron: string | null;
    queryKey: unknown[];
};

export const CronButton = (props: CronButtonProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [isSwitched, setIsSwitched] = useState(props.currentCron !== null);
    const [open, setOpen] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);

    const updateBackupPolicy = useMutation({
        mutationFn: (value: string) =>
            updateBackupPolicyAction({ scope: props.scope, backupPolicy: value }),
        onSuccess: () => {
            toast.success(`Method updated successfully.`);
            queryClient.invalidateQueries({ queryKey: props.queryKey });
            router.refresh();
        },
        onError: () => {
            toast.error(`An error occurred while updating backup method.`);
        },
    });

    const handleTypeChange = async (state: boolean) => {
        setIsSwitched(state);
        if (!state) {
            setIsDirty(false);
            await updateBackupPolicy.mutateAsync("");
        }
    };

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && isDirty) {
            setConfirmDiscardOpen(true);
            return;
        }
        setOpen(nextOpen);
    };

    const handleConfirmDiscard = () => {
        setConfirmDiscardOpen(false);
        setIsDirty(false);
        setOpen(false);
    };

    const preventIfInsideAlertDialog = (e: Event) => {
        if (e.target instanceof Element && e.target.closest('[data-slot="alert-dialog-content"]')) {
            e.preventDefault();
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button variant="outline" {...props} onClick={() => setOpen(true)}>
                        <Clock9 />
                    </Button>
                </DialogTrigger>
                <DialogContent
                    className="sm:max-w-[425px]"
                    onPointerDownOutside={preventIfInsideAlertDialog}
                    onInteractOutside={preventIfInsideAlertDialog}
                    onEscapeKeyDown={(e) => {
                        if (confirmDiscardOpen) e.preventDefault();
                    }}
                >
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
                            scope={props.scope}
                            currentCron={props.currentCron}
                            onSuccess={() => {
                                setIsDirty(false);
                                setOpen(false);
                            }}
                            onDirtyChange={setIsDirty}
                        />
                    ) : null}
                </DialogContent>
            </Dialog>
            <AlertDialog open={confirmDiscardOpen} onOpenChange={setConfirmDiscardOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Your cron schedule has unsaved changes. Closing now will discard them.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDiscard}>Discard</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
