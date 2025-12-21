"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, useZodForm } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { PasswordStrengthInput } from "@/components/ui/password-input-indicator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/auth/auth-client";
import { ResetPasswordSecuritySchema, ResetPasswordSecuritySchemaType } from "../schemas/security.schema";
import {PasswordInput} from "@/components/ui/password-input";

type ResetPasswordFormProps = {
    onSuccess?: () => void;
    isDefault?: boolean;
};

export default function ResetPasswordForm({ onSuccess, isDefault }: ResetPasswordFormProps) {
    const router = useRouter();

    const [allowConfirmPassword, setAllowConfirmPassword] = useState(false);

    const form = useZodForm({
        schema: ResetPasswordSecuritySchema,
    });

    const { mutate: changePassword, isPending: isChangingPassword } = useMutation({
        mutationFn: async (values: ResetPasswordSecuritySchemaType) => {
            const { error } = await authClient.changePassword({
                currentPassword: values.currentPassword,
                newPassword: values.newPassword,
                revokeOtherSessions: true,
            });
            // await authClient.updateUser({
            //     isDefaultPassword: false,
            // });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Password reset successfully.");
            form.reset();
            router.refresh();
            setAllowConfirmPassword(false);

            if (onSuccess) {
                onSuccess();
            }
        },
        onError: () => {
            toast.error("Failed to reset password.");
        },
    });


    return (
        <Form
            form={form}
            onSubmit={async (values) => {
                changePassword(values);
            }}
        >
            {!isDefault && (
                <Alert>
                    <AlertDescription>After resetting your password, you will be logged out of all devices.</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="currentPassword"
                    defaultValue=""
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Current password</FormLabel>
                            <FormControl>
                                <PasswordInput placeholder={'Fill your current password'} {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="newPassword"
                    defaultValue=""
                    render={({ field }) => (
                        <FormItem>
                            <PasswordStrengthInput
                                label={"New password"}
                                field={field}
                                onValidChange={(valid) => {
                                    setAllowConfirmPassword(valid);
                                }}
                            />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    defaultValue=""
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <PasswordStrengthInput label={"Confirm your password"} field={field} disabled={!allowConfirmPassword} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button disabled={isChangingPassword} type="submit">
                        {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit
                    </Button>
                </div>
            </div>
        </Form>
    );
}


