"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient, passkey } from "@/lib/auth/auth-client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Icon } from "@iconify/react";
import { AuthProviderConfig } from "@/lib/auth/config";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function SocialAuthButtons({ providers }: { providers: AuthProviderConfig[] }) {
    const socialProviders = providers.filter((p) => p.isActive && p.type !== "credential");
    const router = useRouter();

    const [isLoading, setIsLoading] = useState<string | null>(null);

    const handleSocialSignIn = async (provider: AuthProviderConfig) => {
        setIsLoading(provider.id);
        try {
            let result;
            if (provider.id === "passkey") {
                result = await authClient.signIn.passkey({
                    fetchOptions: {
                        onSuccess() {
                            router.push("/dashboard");
                        },
                        onError() {
                            toast.error("An error occurred during passkey authentication. Please try again.");
                        },
                    },
                });
            } else if (provider.type === "sso") {
                result = await authClient.signIn.sso({
                    providerId: provider.id,
                    providerType: "oidc",
                    callbackURL: "/dashboard",
                });
            } else {
                result = await authClient.signIn.social({
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    provider: provider.id as any,
                    callbackURL: "/dashboard",
                });
            }

            if (result?.error) {
                toast.error("An error occurred while signing in with the provider. Please try again.");
            } else if (provider.id !== "passkey") {
                toast.success("Redirecting to provider...");
            }
        } catch (err) {
            toast.error("An error occurred while signing in with the provider. Please try again.");
        } finally {
            setIsLoading(null);
        }
    };

    if (socialProviders.length === 0) return null;

    return (
        <div className="flex flex-col gap-2 w-full">
            {socialProviders.map((provider) => (
                <Button key={provider.id} variant="outline" className="w-full gap-2" onClick={() => handleSocialSignIn(provider)} disabled={!!isLoading}>
                    {isLoading === provider.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : provider.icon.startsWith("/") || provider.icon.startsWith("http") ? (
                        <Image
                            src={provider.icon}
                            alt={provider.id || "icon"}
                            width={16}
                            height={16}
                            className="h-4 w-4"
                            unoptimized={provider.icon.startsWith("http")}
                        />
                    ) : (
                        <Icon icon={provider.icon} className="h-4 w-4" />
                    )}
                    <span>{provider.title || provider.name}</span>
                </Button>
            ))}
        </div>
    );
}
