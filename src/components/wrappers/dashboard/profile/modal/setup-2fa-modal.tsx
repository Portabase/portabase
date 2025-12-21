"use client";

import {useState} from "react";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm} from "@/components/ui/form";
import {Loader2, Copy, CheckCircle2, ShieldCheck} from "lucide-react";
import {useMutation} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {Setup2FASecuritySchema, Setup2FASecuritySchemaType} from "../schemas/security.schema";
import {toast} from "sonner";
import {authClient} from "@/lib/auth/auth-client";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {InputOTP, InputOTPGroup, InputOTPSlot} from "@/components/ui/input-otp";
import QRCode from "react-qr-code";
import z from "zod";
import {zPassword} from "@/lib/zod";
import {BackupCodesList} from "../components/backup-codes-list";
import {PasswordInput} from "@/components/ui/password-input";

const PasswordSchema = z.object({
    password: zPassword(),
});

type Password = z.infer<typeof PasswordSchema>;

type Setup2FAModalProps = {
    onOpenChange: (open: boolean) => void;
    open: boolean;
};

export function Setup2FAProfileProviderModal({onOpenChange, open}: Setup2FAModalProps) {

    const router = useRouter();
    const [step, setStep] = useState<"PASSWORD" | "QR" | "BACKUP">("PASSWORD");

    const [totpURI, setTotpURI] = useState<string>("");
    const [secret, setSecret] = useState<string>("");
    const [backupCodes, setBackupCodes] = useState<string[]>([]);

    const form = useZodForm({
        schema: Setup2FASecuritySchema,
        defaultValues: {
            code: "",
        },
    });

    const passwordForm = useZodForm({
        schema: PasswordSchema,
        defaultValues: {
            password: "",
        },
    });

    const {mutate: enable2FA, isPending: isEnabling} = useMutation({
        mutationFn: async (values: Password) => {
            const {data, error} = await authClient.twoFactor.enable({
                password: values.password,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            setTotpURI(data.totpURI);
            setSecret(data.totpURI.split("secret=")[1].split("&")[0]);
            setBackupCodes(data.backupCodes || []);
            setStep("QR");
        },
        onError: () => {
            toast.error("Failed to enable two-factor authentication.");
        },
    });

    const {mutate: verify2FA, isPending: isVerifying} = useMutation({
        mutationFn: async (values: Setup2FASecuritySchemaType) => {
            const {data, error} = await authClient.twoFactor.verifyTotp({
                code: values.code,
                trustDevice: true,
            });

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            toast.success("Two-factor authentication enabled successfully.");
            setStep("BACKUP");
        },
        onError: () => {
            toast.error("The provided code is invalid.");
            form.reset();
        },
    });

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secret);
        toast.success("Secret copied to clipboard");
    };

    const handleClose = () => {
        router.refresh();
        onOpenChange(false);
        setStep("PASSWORD");
        form.reset();
        passwordForm.reset();
    };



    return (
        <Dialog open={open} onOpenChange={(v) => (!v ? handleClose() : onOpenChange(v))}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <ShieldCheck className="w-4 h-4 mr-2"/>
                    Enable Two-Factor
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                        {step === "PASSWORD" && ""}
                        {step === "QR" && "Scan the QR code below with your authentication app or enter the secret key manually."}
                        {step === "BACKUP" && "Save these backup codes in a secure location. They can be used to access your account if you lose access to your authentication device."}
                    </DialogDescription>
                </DialogHeader>

                {step === "PASSWORD" && (
                    <Form form={passwordForm} onSubmit={async (values) => enable2FA(values)}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <FormField
                                    control={passwordForm.control}
                                    name="password"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>Current Password</FormLabel>
                                            <FormControl>
                                                <PasswordInput placeholder="Fill your current password" {...field} />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isEnabling || !passwordForm.formState.isDirty}>
                                    {isEnabling && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    Continue
                                </Button>
                            </div>
                        </div>
                    </Form>
                )}

                {step === "QR" && (
                    <Form
                        form={form}
                        onSubmit={async (values) => {
                            verify2FA(values);
                        }}
                    >
                        <div className="flex flex-col items-center justify-center space-y-6 py-4">
                            <div className="p-4 bg-white rounded-xl shadow-sm border">
                                {totpURI && (
                                    <QRCode value={totpURI} size={180}
                                            style={{height: "auto", maxWidth: "100%", width: "100%"}}
                                            viewBox={`0 0 256 256`}/>
                                )}
                            </div>

                            <div className="w-full space-y-2">
                                <p className="text-xs text-muted-foreground text-center">If you are unable to scan the QR code, you can manually enter the secret key into your authentication app :</p>
                                <div className="flex items-center gap-2">
                                    <code
                                        className="flex-1 bg-muted p-2 rounded text-xs font-mono break-all text-center">{secret}</code>
                                    <Button type="button" size="icon" variant="ghost" onClick={handleCopySecret}>
                                        <Copy className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>

                            <div className="w-full border-t pt-4">
                                <FormField
                                    control={form.control}
                                    name="code"
                                    render={({field}) => (
                                        <FormItem className="flex flex-col items-center">
                                            <FormLabel className="mb-2">Verification Code</FormLabel>
                                            <FormControl>
                                                <InputOTP
                                                    maxLength={6}
                                                    {...field}
                                                    autoFocus
                                                    onChange={(value) => {
                                                        field.onChange(value);
                                                        if (value.length === 6) {
                                                            verify2FA(form.getValues());
                                                        }
                                                    }}
                                                >
                                                    <InputOTPGroup>
                                                        <InputOTPSlot index={0}/>
                                                        <InputOTPSlot index={1}/>
                                                        <InputOTPSlot index={2}/>
                                                        <InputOTPSlot index={3}/>
                                                        <InputOTPSlot index={4}/>
                                                        <InputOTPSlot index={5}/>
                                                    </InputOTPGroup>
                                                </InputOTP>
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex justify-end w-full">
                                <Button disabled={isVerifying} type="submit">
                                    {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                    I've Configured My App
                                </Button>
                            </div>
                        </div>
                    </Form>
                )}

                {step === "BACKUP" && (
                    <div className="space-y-6 py-4">
                        <Alert variant="default"
                               className="border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400"/>
                            <AlertDescription
                                className="text-green-700 dark:text-green-400">Two Factor Authentication is now enabled on your account.</AlertDescription>
                        </Alert>

                        <BackupCodesList codes={backupCodes}/>

                        <div className="flex justify-end pt-2">
                            <Button onClick={handleClose}>Finish Setup</Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
