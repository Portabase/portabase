"use client";

import React, {useState} from "react";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {Loader2, AlertTriangle} from "lucide-react";
import {Account} from "@/db/schema/02_user";
import {authClient} from "@/lib/auth/auth-client";
import {useMutation} from "@tanstack/react-query";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {Alert, AlertDescription} from "@/components/ui/alert";
import {SetPasswordProfileProviderModal} from "./modal/set-password-modal";
import {SUPPORTED_PROVIDERS} from "../../../../../portabase.config";

interface ProfileProviderProps {
    accounts: Account[];
}

export function ProfileProviders({accounts}: ProfileProviderProps) {
    const router = useRouter();
    const totalConnected = accounts.length;

    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

    const {mutate: unlinkAccount, isPending: isUnlinking} = useMutation({
        mutationFn: async (providerId: string) => {
            const {error} = await authClient.unlinkAccount({
                providerId,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Provider successfully unlinked!");
            router.refresh();
        },
        onError: () => {
            toast.error("An error occurred while unlinking provider.");
        },
    });

    const {mutate: linkAccount, isPending: isLinking} = useMutation({
        mutationFn: async (providerId: string) => {
            const {error} = await authClient.signIn.social({
                provider: providerId as "google" | "github",
                callbackURL: "/dashboard",
            });
            if (error) throw error;
        },
        onSuccess: () => {
            toast.success("Provider successfully Linked!");
            router.refresh();
        },
        onError: () => {
            toast.error("An error occurred while linked provider.");
        },
    });

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-300">
            <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Connected Accounts</h2>
                <p className="text-sm text-muted-foreground">Manage the providers used to sign in to your account.</p>
            </div>

            <div className="grid gap-4">
                {SUPPORTED_PROVIDERS.map((provider) => {
                    const linkedAccount = accounts.find((acc) => acc.providerId === provider.id);
                    const isConnected = !!linkedAccount;

                    const canUnlink = totalConnected > 1 || (totalConnected === 1 && !provider.isManual);
                    const isLoading = isUnlinking || isLinking;

                    return (
                        <div key={provider.id}
                             className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <provider.icon className="w-5 h-5"/>
                                </div>
                                <div className="space-y-0.5">
                                    <div className="font-medium flex items-center gap-2">
                                        {PROVIDERS_TEXT[provider.id].title}
                                        {isConnected && (
                                            <Badge variant="secondary"
                                                   className="text-[10px] h-5 px-1.5 text-green-600 bg-green-500/10 border-0">
                                                Active
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {isConnected ? "Connected" : "Not Connected"}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {isConnected ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span tabIndex={0}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => unlinkAccount(provider.id)}
                                                        disabled={!canUnlink || isLoading || provider.isManual}
                                                        className={!canUnlink ? "opacity-50 cursor-not-allowed" : ""}
                                                    >
                                                        {isLoading ? <Loader2
                                                            className="w-4 h-4 animate-spin"/> : "Unlink"}
                                                    </Button>
                                                </span>
                                            </TooltipTrigger>
                                            {!canUnlink && (
                                                <TooltipContent>
                                                    <p>
                                                        You cannot unlink your last authentication provider or if you
                                                        don't have a password set.
                                                    </p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <>
                                        {provider.id === "credential" ? (
                                            <SetPasswordProfileProviderModal open={isPasswordDialogOpen}
                                                                             onOpenChange={setIsPasswordDialogOpen}/>
                                        ) : (
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => linkAccount(provider.id)}
                                                disabled={isLoading || provider.isManual}
                                            >
                                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Link"}
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Alert variant={"default"}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5"/>
                <AlertDescription>
                    Linked providers allow you to log in to your account using any of these methods. If you use the same
                    email address with another provider, it will be automatically linked when you log in.
                </AlertDescription>
            </Alert>
        </div>
    );
}


const PROVIDERS_TEXT = {
    credential: {
        title: "Password",
        description: "Use your email address and password to sign in.",
    },
    google: {
        title: "Google",
        description: "Sign in with your Google account.",
    },
    github: {
        title: "GitHub",
        description: "Sign in with your GitHub account.",
    },
};

