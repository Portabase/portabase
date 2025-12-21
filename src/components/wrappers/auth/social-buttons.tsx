"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {SUPPORTED_PROVIDERS} from "../../../../portabase.config";

export function SocialAuthButtons() {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSocialSignIn = async (providerId: string) => {
        setIsLoading(providerId);
        try {
            const { error } = await authClient.signIn.social({
                provider: providerId as "google" | "github",
                callbackURL: "/dashboard",
            });

            if (error) {
                toast.error("An error occurred while signing in with the provider. Please try again.");
            } else {
                toast.success("Redirecting to provider...");
            }
        } catch (err) {
            toast.error("An error occurred while signing in with the provider. Please try again.");
        } finally {
            setIsLoading(null);
        }
    };

    const socialProviders = SUPPORTED_PROVIDERS.filter((p) => !p.isManual);

    if (socialProviders.length === 0) return null;


    return (
        <div className="flex flex-col gap-2 w-full">
            {socialProviders.map((provider) => (
                <Button key={provider.id} variant="outline" className="w-full gap-2" onClick={() => handleSocialSignIn(provider.id)} disabled={!!isLoading}>
                    {isLoading === provider.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <provider.icon className="h-4 w-4" />}
                    <span>{PROVIDERS_TEXT[provider.id].title}</span>
                </Button>
            ))}
        </div>
    );
}


const PROVIDERS_TEXT = {
    credential: {
        title: "Password",
        description: "Use your email address and password to sign in."
    },
    google: {
        title: "Google",
        description: "Sign in with your Google account."
    },
    github: {
        title: "GitHub",
        description: "Sign in with your GitHub account."
    }
}