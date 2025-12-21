"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { Loader2, FileKey2, RefreshCw, AlertTriangle, Download } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { z } from "zod";
import { zPassword } from "@/lib/zod";
import { BackupCodesList } from "../components/backup-codes-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {PasswordInput} from "@/components/ui/password-input";

const PasswordSchema = z.object({
    password: zPassword(),
});

type Password = z.infer<typeof PasswordSchema>;

type ViewBackupCodesModalProps = {
    onOpenChange: (open: boolean) => void;
    open: boolean;
};

export function ViewBackupCodesModal({ onOpenChange, open }: ViewBackupCodesModalProps) {


    const [step, setStep] = useState<"PASSWORD" | "CODES">("PASSWORD");
    const [codes, setCodes] = useState<string[]>([]);

    const form = useZodForm({
        schema: PasswordSchema,
        defaultValues: {
            password: "",
        },
    });

    const { mutate: generateCodes, isPending } = useMutation({
        mutationFn: async (values: Password) => {
            const { data, error } = await authClient.twoFactor.generateBackupCodes({
                password: values.password,
            });
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            if (data?.backupCodes) {
                setCodes(data.backupCodes);
                setStep("CODES");
                toast.success("New backup codes generated successfully.");
            }
        },
        onError: () => {
            toast.error("Failed to generate backup codes. Your password may be incorrect.");
        },
    });

    const handleClose = () => {
        form.reset();
        setStep("PASSWORD");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <FileKey2 className="w-4 h-4 mr-2" />
                    Regenerate Backup Codes
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Backup Codes</DialogTitle>
                    <DialogDescription>{step === "PASSWORD" ? "For security reasons, existing codes are hidden. You must generate a new set to view them." : "Save these codes securely. They will not be shown again once you close this window."}</DialogDescription>
                </DialogHeader>

                {step === "PASSWORD" && (
                    <Form form={form} onSubmit={(values) => generateCodes(values)}>
                        <div className="space-y-4 py-2">
                            <Alert variant="destructive" className="py-3 w-fit">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle className="text-sm font-semibold ml-2">Important</AlertTitle>
                                <AlertDescription className="text-xs ml-2 mt-1">Generating new codes will invalidate your existing ones. Make sure to save the new codes securely.</AlertDescription>
                            </Alert>

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <PasswordInput placeholder={"Fill your current Password"} {...field} autoFocus />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="submit" disabled={isPending} variant="default">
                                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                    Generate New Codes
                                </Button>
                            </div>
                        </div>
                    </Form>
                )}

                {step === "CODES" && (
                    <div className="space-y-6 py-2 animate-in fade-in zoom-in-95 duration-200">
                        <BackupCodesList codes={codes} />

                        <div className="flex flex-col sm:flex-row justify-between gap-2 pt-2">
                            <Button onClick={() => handleClose()} className="w-full sm:w-auto">
                                I Have Saved My Codes
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
