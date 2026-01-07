"use client";

import {useRouter} from "next/navigation";
import {useMutation} from "@tanstack/react-query";
import {Form, FormControl, FormField, FormItem, FormLabel, useZodForm} from "@/components/ui/form";
import {PasswordStrengthInput} from "@/components/ui/password-input-indicator";
import {ResetPasswordSchema, ResetPasswordType} from "@/components/wrappers/auth/reset-password/reset-password-schema";
import {PasswordInput} from "@/components/ui/password-input";
import {CardContent, CardHeader} from "@/components/ui/card";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {authClient} from "@/lib/auth/auth-client";
import {toast} from "sonner";
import {CardAuth} from "@/features/layout/card-auth";

type ResetPasswordFormProps = {
    token: string;
};

export const ResetPasswordForm = ({token}: ResetPasswordFormProps) => {

    const router = useRouter();
    const form = useZodForm({
        schema: ResetPasswordSchema,
    });

    const mutationResetPassword = useMutation({
        mutationFn: async (data: ResetPasswordType) => {

            await authClient.resetPassword({
                newPassword: data.password,
                token,
            }, {
                onSuccess: (response) => {
                    toast.success("Password changed successfully.");
                    setTimeout(() => router.push("/"), 1000);
                },
                onError: (error) => {
                    console.error(error);
                    toast.error(error.error.message);
                },
            });
        },
    });

    return (
        <CardAuth>
            <CardHeader>
                <div className="grid gap-2 text-center mb-2">
                    <h1 className="text-3xl font-bold">Reset Password</h1>
                    <p className="text-balance text-muted-foreground">Fill information bellow to change your
                        password</p>
                </div>
            </CardHeader>
            <CardContent>
                <Form
                    form={form}
                    className="flex flex-col gap-4"
                    onSubmit={async (values) => {
                        await mutationResetPassword.mutateAsync(values);
                    }}
                >
                    <FormField
                        control={form.control}
                        name="password"
                        defaultValue=""
                        render={({field}) => (
                            <FormItem>
                                <PasswordStrengthInput label={"Enter new password"} field={field}/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        defaultValue=""
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Confirmation Password</FormLabel>
                                <FormControl>
                                    <PasswordInput placeholder={"Confirm password"} {...field}
                                                   value={field.value ?? ""}/>
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <ButtonWithLoading type="submit" isPending={mutationResetPassword.isPending}>
                        Validate
                    </ButtonWithLoading>
                </Form>
            </CardContent>
        </CardAuth>
    );
};
