"use client";

import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";

import {FormControl, FormField, FormItem, FormLabel, useZodForm} from "@/components/ui/form";
import {Form} from "@/components/ui/form";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import Link from "next/link";
import {ResetPasswordSchema, ResetPasswordType} from "./reset-password-form.schema";
import {PasswordStrengthInput} from "@/components/ui/password-input-indicator";
import {useRouter, useSearchParams} from "next/navigation";
import {ArrowLeft} from "lucide-react";
import {authClient} from "@/lib/auth/auth-client";
import {BetterAuthError} from "@/types/auth";
import {PasswordInput} from "@/components/ui/password-input";

export type ResetPasswordFormProps = {
    defaultValues?: ResetPasswordType;
};

export const ResetPasswordForm = (props: ResetPasswordFormProps) => {
    const searchParams = useSearchParams();

    const form = useZodForm({
        schema: ResetPasswordSchema,
    });

    const router = useRouter();


    const mutation = useMutation({
        mutationFn: async (values: ResetPasswordType) => {

            const {data, error} = await authClient.resetPassword({
                newPassword: values.password,
                token: searchParams.get("token") || "",
            });

            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Password successfully reset!");
            setTimeout(() => router.push("/"), 1400);
        },
        onError: (error: BetterAuthError) => {
            toast.error("An error occurred while resetting password");
        },
    });


    return (
        <Form
            form={form}
            className="flex flex-col gap-4 mb-1"
            onSubmit={async (values) => {
                await mutation.mutateAsync(values);
            }}
        >
            <FormField
                control={form.control}
                name="password"
                defaultValue=""
                render={({field}) => (
                    <FormItem>
                        <PasswordStrengthInput label={"New password"} field={field}/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="confirmPassword"
                defaultValue=""
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Confirmation password</FormLabel>
                        <FormControl>
                            <PasswordInput placeholder={"Enter your conformation password"} {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />

            <div className="flex flex-col items-center gap-y-6 w-full">
                <ButtonWithLoading className="mt-2 w-full" isPending={mutation.isPending}>
                    Reset
                </ButtonWithLoading>
                <Link href="/login" className="group flex items-center text-sm hover:underline">
                    <ArrowLeft
                        className="mr-1 size-4 text-muted-foreground transition-transform group-hover:-translate-x-1"/>
                    Back to login
                </Link>
            </div>
        </Form>
    );
};
