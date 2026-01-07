"use client";

import {useEffect} from "react";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {AlertCircle, Loader2} from "lucide-react";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {authClient} from "@/lib/auth/auth-client";
import {User} from "@/db/schema/02_user";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {EmailSchema, EmailSchemaType} from "./schemas/account.schema";
import {BetterAuthError} from "@/types/auth";


interface ProfileAccountProps {
    user: User;
}

export function ProfileAccount({user}: ProfileAccountProps) {

    const router = useRouter();

    useEffect(() => {
        let interval: NodeJS.Timeout;

        interval = setInterval(async () => {
            router.refresh();
        }, 5000);

        return () => {
            if (interval) clearInterval(interval);
        };
    });

    const emailForm = useZodForm({
        schema: EmailSchema,
        defaultValues: {
            email: user.email,
        },
    });

    const {mutate: updateEmail, isPending: isUpdatingEmail} = useMutation({
        mutationFn: async (values: EmailSchemaType) => {
            const {error} = await authClient.changeEmail({
                newEmail: values.email,
                callbackURL: window.location.href,
            });

            if (error) throw error;
            return values.email;
        },
        onSuccess: (newEmail) => {
            toast.success("Email updated successfully.");
            emailForm.reset({email: newEmail});

            router.refresh();
        },
        onError: (error: BetterAuthError) => {
            if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
                toast.error("User already exists, use another email address!");
                emailForm.reset({email: user.email});
                router.refresh()
            } else {
                toast.error("An error occurred while trying to update your password!");
            }
        },
    });

    const {mutate: resendVerificationEmail, isPending: isResendingVerification} = useMutation({
        mutationFn: async () => {
            const currentEmailInput = emailForm.getValues("email");


            let error: BetterAuthError | null = null;

            if (currentEmailInput === user.email) {
                const sendVerification = await authClient.sendVerificationEmail({
                    email: currentEmailInput,
                    callbackURL: window.location.href,
                });
                error = sendVerification.error;
            } else {
                const result = await authClient.changeEmail({
                    callbackURL: window.location.href,
                    newEmail: currentEmailInput,
                });
                error = result.error;
            }

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Verification email resent successfully.");
        },
        onError: (e: BetterAuthError) => {
            console.error(e);
            toast.error("Failed to resend verification email.");
        },
    });


    return (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Account Settings</h2>
                <p className="text-sm text-muted-foreground">Update your email and preferences.</p>
            </div>

            <div className="space-y-4">
                <Form form={emailForm} onSubmit={(values) => updateEmail(values)}>
                    <div className="grid gap-3">
                        <FormField
                            control={emailForm.control}
                            name="email"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Email Address</FormLabel>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                                            <FormControl>
                                                <Input {...field} placeholder="Your email address"/>
                                            </FormControl>

                                            <div className="flex flex-col md:flex-row gap-3">
                                                <Button type="submit" variant="secondary"
                                                        disabled={isUpdatingEmail || !emailForm.formState.isDirty}>
                                                    {isUpdatingEmail &&
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                    {"Update"}
                                                </Button>

                                                {!user.emailVerified && (
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={() => resendVerificationEmail()}
                                                        disabled={isResendingVerification || emailForm.formState.errors.email !== undefined}
                                                    >
                                                        {isResendingVerification &&
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                                        {"Resend Verification"}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <FormMessage/>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {!user.emailVerified && (
                            <div
                                className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-2 rounded-md border border-amber-100 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400 max-w-xl">
                                <AlertCircle className="w-4 h-4"/>
                                <span>Your email is not verified. Please check your inbox.</span>
                            </div>
                        )}
                    </div>
                </Form>
            </div>
        </div>
    );
}
