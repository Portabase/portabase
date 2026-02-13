"use client";

import {useEffect, useState} from "react";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Form} from "@/components/ui/form";
import {LoginSchema, LoginType} from "@/components/wrappers/auth/login/login-form/login-form.schema";
import {signIn} from "@/lib/auth/auth-client";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {PasswordInput} from "@/components/ui/password-input";

export type loginFormProps = {
    defaultValues?: LoginType;
};

export const LoginForm = (props: loginFormProps) => {


    const [urlParams, setUrlParams] = useState<URLSearchParams>();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        setUrlParams(urlParams);
        const error = urlParams.get("error");
        if (error?.includes("pending")) {
            toast.error("Your account is not active.");
            urlParams.delete("error");
            window.history.replaceState({}, document.title, window.location.pathname + "?" + urlParams.toString());
        }
        if (error?.includes("invalid_or_expired_token")) {
            toast.error("Password reset invalid token.");
            urlParams.delete("error");
            window.history.replaceState({}, document.title, window.location.pathname + "?" + urlParams.toString());
        }
    }, []);

    const form = useZodForm({
        schema: LoginSchema,
    });

    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async (values: LoginType) => {
            await signIn.email(
                {
                    password: values.password,
                    email: values.email,
                    callbackURL: urlParams?.get("redirect") ?? "/dashboard",
                },
                {
                    onSuccess: (context) => {
                        if (context.data.twoFactorRedirect) {
                            //@ts-ignore
                            router.push("/guard?redirect=" + encodeURIComponent(context.data.callbackURL || "/dashboard"));
                        }

                        toast.success("Login success");
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
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                            <Input autoComplete="email" autoFocus placeholder="example@portabase.io" {...field} />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="password"
                defaultValue=""
                render={({field}) => (
                    <FormItem>
                        <div className="flex items-center justify-between">
                            <FormLabel>Password</FormLabel>
                            <div className="text-center text-sm">
                                <Link href={"/forgot-password"} className="hover:underline ml-1">
                                    Forgot your password ?
                                </Link>
                            </div>
                        </div>
                        <FormControl>
                            <PasswordInput autoComplete="current-password webauthn"
                                           placeholder={"Enter your password"} {...field} />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <ButtonWithLoading className="mt-2 h-11" isPending={mutation.isPending}>
                Login
            </ButtonWithLoading>
        </Form>
    );
};
