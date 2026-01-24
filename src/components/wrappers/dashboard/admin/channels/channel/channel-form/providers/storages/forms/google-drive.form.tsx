"use client";

import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {Button} from "@/components/ui/button";
import {PasswordInput} from "@/components/ui/password-input";
import {
    googleDriveRefreshTokenAction
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/providers/storages/forms/google-drive/helpers";
import {toast} from "sonner";

type StorageGoogleDriveFormProps = {
    form: UseFormReturn<any>;
};

export const StorageGoogleDriveForm = ({form}: StorageGoogleDriveFormProps) => {
    const refreshToken = form.watch("config.refreshToken");
    const isConnected = Boolean(refreshToken);

    const handleConnect = () => {
        const clientId = form.getValues("config.clientId");
        const clientSecret = form.getValues("config.clientSecret");
        const redirectUri = `${window.location.origin}/api/google/drive/callback`;

        if (!clientId || !clientSecret) {
            form.setError("config.clientId", {message: "Client ID and Secret are required"});
            return;
        }

        const scope = encodeURIComponent("https://www.googleapis.com/auth/drive.file");
        const oauthUrl =
            `https://accounts.google.com/o/oauth2/v2/auth` +
            `?client_id=${clientId}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            `&response_type=code` +
            `&scope=${scope}` +
            `&access_type=offline` +
            `&prompt=consent`;

        const oauthWindow = window.open(oauthUrl, "_blank", "width=500,height=600");

        const interval = setInterval(async () => {
            try {
                if (!oauthWindow || oauthWindow.closed) {
                    clearInterval(interval);
                    return;
                }

                if (oauthWindow.location.href.startsWith(redirectUri)) {
                    const code = new URL(oauthWindow.location.href).searchParams.get("code");
                    if (!code) return;

                    const result = await googleDriveRefreshTokenAction({
                        code,
                        clientId,
                        clientSecret,
                        redirectUri,
                    });
                    const inner = result?.data;

                    if (inner?.success) {
                        toast.success(inner.actionSuccess?.message);

                        if (!inner.value) {
                            form.setError("config", {message: "OAuth succeeded but no refresh token returned"});
                            return;
                        }

                        form.setValue("config.refreshToken", inner.value, {
                            shouldValidate: true,
                            shouldDirty: true,
                        });

                    } else {
                        toast.error(inner?.actionError?.message);
                    }


                    oauthWindow.close();
                    clearInterval(interval);
                }
            } catch {
                // Ignore cross-origin errors until redirect
            }
        }, 500);
    };

    return (
        <>
            <Separator className="my-1"/>

            <FormField
                control={form.control}
                name="config.clientId"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Client ID</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="xxxx.apps.googleusercontent.com"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.clientSecret"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Client Secret</FormLabel>
                        <FormControl>
                            <PasswordInput {...field} />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.folderId"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Folder ID</FormLabel>
                        <FormControl>
                            <Input {...field} />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <input type="hidden" {...form.register("config.refreshToken")} />

            <div className="flex items-center gap-3">
                <Button type="button" onClick={handleConnect}>
                    {isConnected ? "Reconnect Google Drive" : "Connect Google Drive"}
                </Button>

                {isConnected && (
                    <span className="text-sm text-green-600 font-medium">
            Google Drive connected
          </span>
                )}
            </div>
        </>
    );
};
