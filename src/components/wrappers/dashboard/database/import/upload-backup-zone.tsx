"use client";

import {DropZoneFile} from "@/components/wrappers/common/dropzone/dropzone-file";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {Loader2} from "lucide-react";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {toast} from "sonner";
import {uploadBackupAction} from "@/components/wrappers/dashboard/database/import/upload-backup.action";
import {Card, CardContent} from "@/components/ui/card";

type UploadRetentionZoneProps = {
    onSuccessAction?: () => void;
    databaseId: string;
};

export const UploadBackupZone = ({onSuccessAction, databaseId}: UploadRetentionZoneProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();

    const [isProcessing, setIsProcessing] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const mutationUpload = useMutation({
        mutationFn: async (file: File) => {

            try {
                setIsProcessing(true);

                const formData = new FormData();
                formData.append("file", file);
                formData.append("databaseId", databaseId);

                const result = await uploadBackupAction(formData)

                const inner = result?.data;
                if (inner?.success) {
                    toast.success(inner.actionSuccess?.message);
                    onSuccessAction?.()
                    queryClient.invalidateQueries({queryKey: ["database-data", databaseId]});
                    router.refresh();
                } else {
                    toast.error(inner?.actionError?.message);
                }
            } catch (err) {
                console.error(err);
                toast.error("An error occurred while upload in the backup");
            } finally {
                queryClient.invalidateQueries({queryKey: ["database-data", databaseId]});
                setIsProcessing(false);
            }
        },
    });


    const acceptDbImportFiles: Record<string, string[]> = {
        "application/sql": [".sql"],
        "application/x-sql": [".sql"],
        "text/plain": [".sql"],
        "application/octet-stream": [".dump"],
    };

    return (
        <>
            {isProcessing ? (
                <UploadLoader label="Uploading database backup…"/>
            ) : (
                <DropZoneFile
                    accept={acceptDbImportFiles}
                    maxSize={500 * 1024 * 1024}
                    maxFiles={1}
                    description="Import database backup"
                    fileKind="Database file (.sql, .dump)"
                    dragMessage="Click or drag a database dump here"
                    onFileDropAction={(file: File) => setFile(file)}
                />
            )}

            {(!isProcessing && file) && (
                <div className="flex gap-4 justify-end">
                    <ButtonWithLoading
                        onClick={() => mutationUpload.mutateAsync(file)}
                        isPending={false}>
                        Upload
                    </ButtonWithLoading>
                </div>
            )}


        </>
    );
};


const UploadLoader = ({label = "Processing uploading..."}: { label?: string }) => {
    return (
        <Card className="w-full border">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
                <div className="relative">
                    <Loader2 className="w-8 h-8 animate-spin inset-0"/>
                </div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                    Do not close this window
                </p>
            </CardContent>
        </Card>
    );
};