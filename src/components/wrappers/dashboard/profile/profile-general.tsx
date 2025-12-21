"use client";

import React from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {Loader2} from "lucide-react";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    useZodForm
} from "@/components/ui/form";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {updateProfileSettingsAction} from "./actions/profile.action";
import {User} from "@/db/schema/02_user";
import {ProfileSchema, ProfileSchemaType} from "./schemas/general.schema";
import {AvatarWithUpload} from "@/components/wrappers/dashboard/profile/components/avatar-with-upload";

interface ProfileGeneralProps {
    user: User;
}

export function ProfileGeneral({user}: ProfileGeneralProps) {
    const router = useRouter();

    const profileForm = useZodForm({
        schema: ProfileSchema,
        defaultValues: {
            name: user.name || "",
            role: user.role || "",
        },
    });

    const {mutate: updateProfile, isPending: isUpdatingProfile} = useMutation({
        mutationFn: async (values: ProfileSchemaType) => {
            const result = await updateProfileSettingsAction({name: values.name});
            const inner = result?.data;
            if (inner?.success) {
                toast.success("Profile updated successfully.");
                router.refresh();
                profileForm.reset({name: values.name, role: values.role});
            } else {
                toast.error("Failed to update profile.");
            }
        },
    });

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Profile Settings</h2>
                <p className="text-sm text-muted-foreground">Manage your personal information and preferences.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="flex flex-col items-center gap-4">
                    <AvatarWithUpload
                        user={user}
                    />
                </div>

                <div className="flex-1 w-full max-w-lg">
                    <Form form={profileForm} onSubmit={(values) => updateProfile(values)}>
                        <div className="space-y-6">
                            <FormField
                                control={profileForm.control}
                                name="name"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Display Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormDescription>This is your public display name</FormDescription>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />

                            <div className="grid gap-2">
                                <FormField
                                    control={profileForm.control}
                                    name={"role"}
                                    render={({field}) => (
                                        <FormItem>
                                        <FormLabel
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Role & Permissions
                                        </FormLabel>
                                            <FormControl>
                                                <div className="flex items-center gap-2 pt-1">
                                                    <RoleBadge role={field.value || "undefined"}/>
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button type="submit" disabled={isUpdatingProfile || !profileForm.formState.isDirty}>
                                    {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Update
                                </Button>
                            </div>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}

function RoleBadge({role}: { role: string }) {

    const variant = role === "admin" ? "default" : "secondary";

    return (
        <Badge variant={variant} className="capitalize px-2 py-0.5 text-xs">
            {role}
        </Badge>
    );
}
