"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Loader2, ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { authClient } from "@/lib/auth/auth-client";
import TwoFactorForm from "../form/2fa-form";
import { zPassword } from "@/lib/zod";
import {PasswordInput} from "@/components/ui/password-input";

const PasswordSchema = z.object({
    password: zPassword(),
});

type Password = z.infer<typeof PasswordSchema>;

type Disable2FAModalProps = {
    onOpenChange: (open: boolean) => void;
    open: boolean;
};

export function Disable2FAProfileProviderModal({ onOpenChange, open }: Disable2FAModalProps) {

    const router = useRouter();
    const [step, setStep] = useState<"OTP" | "PASSWORD">("OTP");

    const passwordForm = useZodForm({
        schema: PasswordSchema,
        defaultValues: {
            password: "",
        },
    });

    const { mutate: disable2FA, isPending: isDisabling } = useMutation({
        mutationFn: async (values: Password) => {
            const { data, error } = await authClient.twoFactor.disable({
                password: values.password,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            router.refresh();
            toast.success("Two-factor authentication disabled successfully.");
            onOpenChange(false);
            setStep("OTP");
            passwordForm.reset();
        },
        onError: () => {
            toast.error("Failed to disable two-factor authentication.");
        },
    });

    const handleClose = () => {
        passwordForm.reset();
        setStep("OTP");
        onOpenChange(false);
    };


    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <ShieldX className="w-4 h-4 mr-2" />
                    Disable Two-Factor
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
                    <DialogDescription>Are you sure you want to disable two-factor authentication? This will reduce the security of your account.</DialogDescription>
                </DialogHeader>

                {step === "OTP" && (
                    <TwoFactorForm
                        onSuccess={(success) => {
                            if (success) {
                                setStep("PASSWORD");
                            }
                        }}
                    />
                )}

                {step === "PASSWORD" && (
                    <Form form={passwordForm} onSubmit={async (values) => disable2FA(values)}>
                        <FormField
                            control={passwordForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                        <PasswordInput placeholder={"Fill your current Password"} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-between items-center pt-2">
                            <Button type="button" variant="ghost" onClick={() => setStep("OTP")} disabled={isDisabling}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isDisabling || !passwordForm.formState.isDirty}>
                                {isDisabling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Disable
                            </Button>
                        </div>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
