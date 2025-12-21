"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Form } from "@/components/ui/form";
import { requestPasswordReset } from "@/lib/auth/auth-client";
import { ButtonWithLoading } from "@/components/wrappers/common/button/button-with-loading";
import Link from "next/link";
import { ForgotPasswordSchema, ForgotPasswordType } from "./forgot-password-form.schema";
import { ArrowLeft } from "lucide-react";

export type ForgotPasswordFormProps = {
    defaultValues?: ForgotPasswordType;
};

export const ForgotPasswordForm = (props: ForgotPasswordFormProps) => {

    const form = useZodForm({
        schema: ForgotPasswordSchema,
    });

    const mutation = useMutation({
        mutationFn: async (values: ForgotPasswordType) => {
            await requestPasswordReset(
                {
                    email: values.email,
                },
                {
                    onSuccess: () => {
                        toast.success("Password reset successfully.");
                    },
                    onError: (error) => {
                        toast.error(error.error.message);
                    },
                }
            );
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
                name="email"
                defaultValue=""
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                            <Input autoComplete="email" autoFocus
                                   placeholder="example@portabase.io"
                                   {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="flex flex-col items-center gap-y-6 w-full">
                <ButtonWithLoading className="mt-2 w-full" isPending={mutation.isPending}>
                    Send reset link
                </ButtonWithLoading>
                <Link href="/login" className="group flex items-center text-sm hover:underline">
                    <ArrowLeft className="mr-1 size-4 text-muted-foreground transition-transform group-hover:-translate-x-1" />
                    Back to login
                </Link>
            </div>
        </Form>
    );
};
