"use client";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {UploadIcon} from "lucide-react";
import {toast} from "sonner";
import {uploadUserImageAction} from "@/features/upload/public/upload.action";
import {useMutation} from "@tanstack/react-query";
import {updateImageUserAction} from "@/components/wrappers/dashboard/profile/actions/avatar.action";
import {useRouter} from "next/navigation";
import {User} from "@/db/schema/02_user";
import React, {ChangeEvent} from "react";

export type AvatarWithUploadProps = {
    user: User;
};

export const AvatarWithUpload = (props: AvatarWithUploadProps) => {
    const user = props.user;
    const router = useRouter();

    const submitImage = useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.set("file", file);
            const result = await uploadUserImageAction(formData);

            const inner = result?.data;

            if (inner?.success) {

                const updateUser = await updateImageUserAction(inner.value ?? "");
                const dataUser = updateUser?.data;

                if (updateUser?.serverError || !dataUser) {
                    toast.error(updateUser?.serverError);
                    return;
                }

                toast.success(inner.actionSuccess?.message);
                router.refresh();
            } else {
                toast.error(inner?.actionError?.message);
            }


        },
    });

    const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!file.type.includes("image")) {
            toast.error("File not an image");
            return;
        }
        submitImage.mutate(file);
    };


    return (
        <div className="relative ">

            <Avatar className="w-24 h-24 lg:w-32 lg:h-32 border-4 border-muted/20">
                <AvatarImage className="object-cover" src={user.image || undefined}/>
                <AvatarFallback className="text-3xl">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div
                onClick={() => {
                    const fileInput = document.createElement("input");
                    fileInput.type = "file";
                    fileInput.accept = "image/*";
                    // @ts-ignore
                    fileInput.onchange = handleImageUpload;
                    fileInput.click();
                }}
                className="cursor-pointer absolute inset-0 flex justify-center items-center opacity-0 transition-opacity hover:opacity-30 hover:bg-gray-500 hover:bg-opacity-50 rounded-full w-24 h-24 lg:w-32 lg:h-32"
            >
                <UploadIcon className="w-12 h-12 lg:w-16 lg:h-16 text-primary"/>
            </div>
        </div>
    );
};
