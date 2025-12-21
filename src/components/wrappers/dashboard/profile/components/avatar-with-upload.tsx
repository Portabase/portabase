"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { uploadImageAction } from "@/features/upload/public/upload.action";
import { useMutation } from "@tanstack/react-query";
import { updateImageUserAction } from "@/components/wrappers/dashboard/profile2/avatar/avatar.action";
import { useRouter } from "next/navigation";
import { User } from "@/db/schema/02_user";
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
            const uploadImage = await uploadImageAction(formData);
            const data = uploadImage?.data?.data;

            if (uploadImage?.serverError || !data) {
                console.log(uploadImage?.serverError);
                toast.error(uploadImage?.serverError);
                return;
            }

            const updateUser = await updateImageUserAction(data.url);
            const dataUser = updateUser?.data?.data;

            if (updateUser?.serverError || !dataUser) {
                console.log(updateUser?.serverError);
                toast.error(updateUser?.serverError);
                return;
            }

            toast.success("Successfully uploaded user image!");
            router.refresh();
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
                <AvatarImage src={user.image || undefined}/>
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
                className="cursor-pointer absolute inset-0 flex justify-center items-center opacity-0 transition-opacity hover:opacity-100 hover:bg-gray-500 hover:bg-opacity-50 rounded-full w-24 h-24 lg:w-32 lg:h-32"
            >
                <UploadIcon className="w-12 h-12 lg:w-16 lg:h-16 text-primary" />
            </div>
        </div>
    );
};
