"use client";

import {useRouter} from "next/navigation";
import {Info} from "lucide-react";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";

import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Form} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {TooltipProvider, TooltipTrigger, Tooltip, TooltipContent} from "@/components/ui/tooltip";
import {RegisterSchema, RegisterType} from "@/components/wrappers/auth/register/register-form/register-form.schema";
import {PasswordInput} from "@/components/ui/password-input";
import {signUp} from "@/lib/auth/auth-client";
import Link from "next/link";
import {CardAuth} from "@/features/layout/card-auth";

export type registerFormProps = {
    defaultValues?: RegisterType;
};

export const RegisterForm = (props: registerFormProps) => {

    const form = useZodForm({
        schema: RegisterSchema,
    });
    const router = useRouter();
    const mutation = useMutation({
        mutationFn: async (values: RegisterType) => {
            await signUp.email(values, {
                onSuccess: () => {
                    toast.success(`Account successfully created`);
                    router.refresh();
                    router.push(`/login`);
                },
                onError: (error) => {
                    console.log(error);
                    toast.error(error.error.message);
                },
            });
        },
    });


    return (
        <TooltipProvider>
            <CardAuth>
                <CardHeader>
                    <div className="grid gap-2 text-center mb-2">
                        <h1 className="text-3xl font-bold">Create an account</h1>
                        <p className="text-balance text-muted-foreground">Enter your informations bellow to register</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form
                        form={form}
                        className="flex flex-col gap-4"
                        onSubmit={async (values) => {
                            await mutation.mutateAsync(values);
                        }}
                    >
                        <FormField
                            control={form.control}
                            name="name"
                            defaultValue=""
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your name" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            defaultValue=""
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="exemple@portabase.io" {...field} />
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
                                    <FormLabel className="flex">
                                        Password
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="ml-3" size="15"/>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>
                                                        Min. 8 characters, 1 uppercase (A-Z), 1 lowercase (a-z), 1
                                                        number (0-9), 1 special character (!, @,
                                                        etc.)
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </FormLabel>
                                    <FormControl>
                                        <PasswordInput placeholder="Your password" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            defaultValue=""
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Password Confirmation</FormLabel>
                                    <FormControl>
                                        <PasswordInput placeholder="Conform your password" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={mutation.isPending}>
                            Sign up
                        </Button>
                        <div className="mt-4 text-center text-sm">
                            Already have an account ?{" "}
                            <Link href="/login" className="underline">
                                Sign in
                            </Link>
                        </div>

                    </Form>
                </CardContent>
            </CardAuth>
        </TooltipProvider>
    );
};
