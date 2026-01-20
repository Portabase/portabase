"use client";

import {Card, CardContent} from "@/components/ui/card";
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    useZodForm
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Form} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {useMutation} from "@tanstack/react-query";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

import {
    EmailFormSchema,
    EmailFormType
} from "@/components/wrappers/dashboard/admin/settings/email/email-form/email-form.schema";
import {PasswordInput} from "@/components/ui/password-input";
import {
    updateEmailSettingsAction
} from "@/components/wrappers/dashboard/admin/settings/email/email-form/email-form.action";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {sendEmail} from "@/lib/email";
import {render} from "@react-email/components";
import EmailSettingsTest from "@/components/emails/email-settings-test";
import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {Send} from "lucide-react";

export type EmailFormProps = {
    defaultValues?: EmailFormType;
};

export const EmailForm = (props: EmailFormProps) => {
    const form = useZodForm({
        schema: EmailFormSchema,
        defaultValues: props.defaultValues,
    });
    const isDirty = form.formState.isDirty;

    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async (values: EmailFormType) => {
            const updateEmailSettings = await updateEmailSettingsAction({name: "system", data: values});
            const data = updateEmailSettings?.data?.data;
            if (updateEmailSettings?.serverError || !data) {
                toast.error(updateEmailSettings?.serverError);
                return;
            }
            toast.success(`Success updating email informations`);
            form.reset(data);
            router.refresh();
        },
    });

    const mutationSendEmailTest = useMutation({
        mutationFn: async () => {
            if (!props.defaultValues?.smtpUser || !props.defaultValues?.smtpFrom) {
                toast.error("SMTP is not configured");
                return;
            }


            try {
                const email = await sendEmail({
                    to: props.defaultValues.smtpUser,
                    subject: "Portabase",
                    html: await render(EmailSettingsTest(), {}),
                    from: props.defaultValues.smtpFrom,
                });

                if (email?.response) {
                    toast.success("Test Email successfully sent!");
                }

                return email;
            } catch (error: unknown) {
                if (error instanceof Error) {
                    toast.error(`Email sending failed: ${error.message}`);
                } else {
                    toast.error("Unknown error while sending test email");
                }

                throw error;
            }
        },
    });


    return (
        <TooltipProvider>
                    <Form
                        form={form}
                        className="flex flex-col gap-4 mt-3"
                        onSubmit={async (values) => {
                            await mutation.mutateAsync(values);
                        }}
                    >
                        <FormField
                            control={form.control}
                            name="smtpFrom"
                            defaultValue=""
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>From Email *</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"exemple@portabase.com"} {...field} />
                                    </FormControl>
                                    <FormDescription>{"The email from where the email will be send"}</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="smtpHost"
                            defaultValue=""
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Server Host *</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"ssl0.ovh.net"} {...field} />
                                    </FormControl>
                                    <FormDescription>{"Your email server host"}</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="smtpPort"
                            defaultValue=""
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Server Port *</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"465"} {...field} />
                                    </FormControl>
                                    <FormDescription>{"Your email server port (send)"}</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="smtpPassword"
                            defaultValue=""
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <PasswordInput placeholder="Password" {...field} />
                                    </FormControl>
                                    <FormDescription>{"Your email server password"}</FormDescription>

                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="smtpUser"
                            defaultValue=""
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>User Email *</FormLabel>
                                    <FormControl>
                                        <Input placeholder={"exemple@portabase.com"} {...field} />
                                    </FormControl>
                                    <FormDescription>{"The email server user"}</FormDescription>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-between gap-4">
                            {props.defaultValues?.smtpFrom && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div>
                                            <ButtonWithLoading
                                                type="button"
                                                disabled={isDirty || mutationSendEmailTest.isPending}
                                                isPending={mutationSendEmailTest.isPending}
                                                onClick={async () => {
                                                    await mutationSendEmailTest.mutateAsync();
                                                }}
                                                icon={<Send />}
                                                size="default"
                                                className="bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-all"

                                            >
                                                Send email test
                                            </ButtonWithLoading>
                                        </div>
                                    </TooltipTrigger>

                                    {isDirty && (
                                        <TooltipContent>
                                            You must save changes before testing the email settings.
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            )}
                            <div className="flex justify-end">
                                <Button type="submit">
                                    Save
                                </Button>
                            </div>
                        </div>
                    </Form>
        </TooltipProvider>
    );
};
