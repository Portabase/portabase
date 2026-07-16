"use client";

import {useEffect, useState} from "react";
import {AlertTriangle, Loader2, Trash2} from "lucide-react";
import {useQuery} from "@tanstack/react-query";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {Skeleton} from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {countDatabaseBackupsAction} from "@/features/database/actions/backup-count.action";

export type DatabaseDeleteDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    databaseId: string;
    databaseName: string;
    onConfirm: () => void;
    isPending: boolean;
};

export const DatabaseDeleteDialog = (props: DatabaseDeleteDialogProps) => {
    const [value, setValue] = useState("");

    useEffect(() => {
        if (!props.open) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setValue("");
        }
    }, [props.open]);

    const {data: backupCount, isLoading} = useQuery({
        queryKey: ["database-backup-count", props.databaseId],
        queryFn: async () => {
            const result = await countDatabaseBackupsAction({databaseId: props.databaseId});
            return result?.data?.success ? (result.data.value ?? 0) : 0;
        },
        enabled: props.open,
    });

    const matches = value === props.databaseName;

    return (
        <Dialog open={props.open} onOpenChange={props.onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Supprimer la base de données</DialogTitle>
                    <DialogDescription>
                        Cette action est irréversible.
                    </DialogDescription>
                </DialogHeader>

                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4"/>
                    <AlertDescription>
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                En supprimant cette base de données, vous supprimerez
                                <Skeleton className="h-4 w-8 inline-block"/>
                                backups associés
                            </span>
                        ) : (
                            <>En supprimant cette base de données, vous supprimerez {backupCount ?? 0} backups associés</>
                        )}
                    </AlertDescription>
                </Alert>

                <div className="space-y-2">
                    <Input
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        autoComplete="off"
                        disabled={props.isPending}
                        aria-label={`Tapez ${props.databaseName} pour confirmer`}
                    />
                    <Label className="text-sm text-muted-foreground font-normal">
                        Tapez &apos;{props.databaseName}&apos; pour confirmer
                    </Label>
                </div>

                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => props.onOpenChange(false)}
                        disabled={props.isPending}
                    >
                        Annuler
                    </Button>
                    <Button
                        variant="destructive"
                        className="w-full sm:w-auto"
                        disabled={!matches || props.isPending}
                        onClick={() => props.onConfirm()}
                    >
                        {props.isPending && <Loader2 className="animate-spin mr-2" size={16}/>}
                        <Trash2 size={16}/>
                        Supprimer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
