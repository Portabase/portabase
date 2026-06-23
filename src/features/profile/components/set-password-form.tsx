"use client";

import {Button} from "@/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormLabel, useZodForm} from "@/components/ui/form";
import {Loader2} from "lucide-react";
import {PasswordStrengthInput} from "@/components/ui/password-input-indicator";
import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {PasswordProviderSchema, PasswordProviderSchemaType} from "../schemas/provider.schema";
import {linkPasswordProfileProviderAction} from "../actions/provider.action";
import {PasswordInput} from "@/components/ui/password-input";

type SetPasswordFormProps = {
    onSuccess?: () => void;
};

export default function SetPasswordForm({onSuccess}: SetPasswordFormProps) {
    const router = useRouter();

    const form = useZodForm({
        schema: PasswordProviderSchema,
    });

    const {mutateAsync: setPasswordMutation, isPending: isSettingPassword} = useMutation({
        mutationFn: async (values: PasswordProviderSchemaType) => {
            const result = await linkPasswordProfileProviderAction({
                password: values.password,
            });
            return result?.data;
        },
        onSuccess: (data) => {
            if (data?.success) {
                toast.success("Password set successfully.");
                form.reset();
                router.refresh();

                if (onSuccess) {
                    onSuccess();
                }
            } else {
                toast.error("Failed to set password.");
            }
        },
        onError: () => {
            toast.error("Failed to set password.");
        },
    });


    return (
        <Form
            form={form}
            onSubmit={async (values) => {
                await setPasswordMutation(values);
            }}
        >
            <div className="space-y-4 py-4">
                <FormField
                    control={form.control}
                    name="password"
                    defaultValue=""
                    render={({field}) => (
                        <FormItem>
                            <PasswordStrengthInput label={"Password"} field={field}/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="confirmPassword"
                    defaultValue=""
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Confirm password</FormLabel>
                            <FormControl>
                                <PasswordInput placeholder={"Confirm your new password"} {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button disabled={isSettingPassword} type="submit">
                        {isSettingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Set password
                    </Button>
                </div>
            </div>
        </Form>
    );
}
