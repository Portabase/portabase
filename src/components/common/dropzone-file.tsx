"use client";

import {
    CircleCheck,
    CircleX,
    CloudUploadIcon,
    Loader2,
    Trash2Icon,
} from "lucide-react";
import {
    DropZoneArea,
    DropzoneDescription,
    DropzoneFileList,
    DropzoneFileListItem,
    DropzoneMessage,
    DropzoneRemoveFile,
    DropzoneTrigger,
    useDropzone,
    Dropzone,
} from "@/components/ui/dropzone";

type DropZoneFileProps = {
    onFileDropAction?: (file: File) => Promise<void> | void;
    onFileRemoveAction?: (file: File) => void;
    accept?: Record<string, string[]>;
    maxSize?: number;
    maxFiles?: number;
    description?: string;
    fileKind?: string;
    dragMessage?: string;
    fileList?: boolean;
};


export const DropZoneFile = ({
                                 onFileDropAction,
                                 onFileRemoveAction,
                                 accept = {"application/pdf": [".pdf"]},
                                 maxSize = 50 * 1024 * 1024,
                                 maxFiles = 1,
                                 description = "Please select a file",
                                 fileKind = "Upload files (.pdf)",
                                 dragMessage = "Click here or drag & drop to upload",
                                 fileList = true
                             }: DropZoneFileProps) => {
    const dropzone = useDropzone({
        onDropFile: async (file: File) => {
            onFileDropAction?.(file);

            return {
                status: "success",
                result: URL.createObjectURL(file),
            };
        },
        validation: {
            accept,
            maxSize,
            maxFiles,
        },
    });

    const handleRemove = (file: any) => {
        dropzone.onRemoveFile(file.id);
        onFileRemoveAction?.(file.file);
    };

    return (
        <div className="not-prose flex flex-col gap-4 h-full">
            <Dropzone {...dropzone}>
                <div className="h-full">
                    {dropzone.fileStatuses.length < maxFiles && (
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between">
                                <DropzoneDescription>{description}</DropzoneDescription>
                                <DropzoneMessage/>
                            </div>
                            <DropZoneArea className="flex-1 px-0 py-0 mt-2">
                                <DropzoneTrigger
                                    className="flex h-full w-full flex-col items-center justify-center gap-4 bg-transparent p-10 text-center text-sm">
                                    <CloudUploadIcon className="size-8"/>
                                    <div>
                                        <p className="font-semibold">{fileKind}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {dragMessage}
                                        </p>
                                    </div>
                                </DropzoneTrigger>
                            </DropZoneArea>
                        </div>
                    )}
                </div>
                {fileList && (
                    <DropzoneFileList className="grid gap-3 p-0">
                        {dropzone.fileStatuses.map((file) => (
                            <DropzoneFileListItem
                                key={file.id}
                                file={file}
                                className="overflow-hidden rounded-md bg-secondary p-0 shadow-sm"
                            >
                                <div className="flex items-center justify-between p-2 pl-4">
                                    <div className="flex overflow-hidden items-center gap-3">
                                        <div>
                                            {file.status === "pending" ? (
                                                <Loader2 className="animate-spin" size={16}/>
                                            ) : file.status === "error" ? (
                                                <CircleX className="text-red-600" size={16}/>
                                            ) : (
                                                <CircleCheck className="text-green-700" size={16}/>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="truncate text-sm flex">
                                                <span>{file.fileName}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <DropzoneRemoveFile
                                        variant="ghost"
                                        className="shrink-0 hover:outline"
                                        // @ts-ignore
                                        onClick={() => handleRemove(file)}
                                    >
                                        <Trash2Icon className="size-4"/>
                                    </DropzoneRemoveFile>
                                </div>
                            </DropzoneFileListItem>
                        ))}
                    </DropzoneFileList>
                )}

            </Dropzone>
        </div>
    );
};
