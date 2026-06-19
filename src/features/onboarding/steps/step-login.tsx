"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@onboardjs/react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Globe, Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
    useZodForm,
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form";
import { signIn, useSession } from "@/lib/auth/auth-client";
import type { OnboardingMeta } from "@/features/onboarding/types";

const LoginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password required"),
});

type LoginValues = z.infer<typeof LoginSchema>;

export const StepLogin = () => {
    const { next, state } = useOnboarding();
    const router = useRouter();
    const meta = state?.context.flowData.meta as OnboardingMeta | undefined;
    const { data: session } = useSession();

    const passkeyEnabled = meta?.passkeyEnabled ?? false;
    const emailPasswordEnabled = meta?.emailPasswordEnabled ?? false;
    const hasAnySsoProvider = (meta?.ssoProviders?.length ?? 0) > 0;
    const hasAnyAuthMethod = emailPasswordEnabled || passkeyEnabled || hasAnySsoProvider;

    // After login: reload the page so resolveOnboardingState re-runs server-side
    // with the authenticated user and returns the correct resume step + flowData.
    // Calling next() here would keep the stale unauthenticated flowData.
    useEffect(() => {
        if (session?.user) {
            router.push('/welcome');
        }
    }, [session?.user?.id]);

    const form = useZodForm({ schema: LoginSchema });

    const passkeyMutation = useMutation({
        mutationFn: async () => {
            const result = await (signIn as any).passkey();
            if (result?.error) throw new Error(result.error.message ?? "Passkey sign in failed");
            router.push('/welcome');
        },
        onError: (err: Error) => { toast.error(err.message); },
    });

    const loginMutation = useMutation({
        mutationFn: async (values: LoginValues) => {
            const result = await signIn.email({
                email: values.email,
                password: values.password,
            });
            if (result.error) throw new Error(result.error.message ?? "Sign in failed");
            router.push('/welcome');
        },
        onError: (err: Error) => { toast.error(err.message); },
    });

    const handleSso = async (providerId: string) => {
        try {
            await signIn.social({ provider: providerId as any, callbackURL: "/welcome" });
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "SSO sign in failed");
        }
    };

    // No auth methods configured
    if (!hasAnyAuthMethod) {
        return (
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">No authentication configured</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Enable at least one authentication method in your environment variables to continue.
                    </p>
                </div>
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
                    Set <code className="font-mono">AUTH_EMAIL_PASSWORD_ENABLED=true</code>,{" "}
                    <code className="font-mono">AUTH_PASSKEY_ENABLED=true</code>, or configure an SSO provider.
                </div>
            </div>
        );
    }

    // New user registration flow
    if (!meta?.hasExistingUsers) {
        return (
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">Welcome to Portabase</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Set up your instance by creating the first account.
                    </p>
                </div>
                {hasAnySsoProvider && (
                    <div className="flex flex-col gap-2">
                        {meta?.ssoProviders.map((provider) => (
                            <button
                                key={provider.id}
                                type="button"
                                onClick={() => handleSso(provider.id)}
                                className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
                            >
                                <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                                    <Globe className="size-4 text-muted-foreground" />
                                </div>
                                <span>Continue with {provider.label}</span>
                            </button>
                        ))}
                    </div>
                )}
                {emailPasswordEnabled && (
                    <Button type="button" onClick={() => next()}>
                        <Mail className="size-4 mr-2" />
                        Register with email
                    </Button>
                )}
            </div>
        );
    }

    // Existing user login flow
    return (
        <div className="flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-semibold">Welcome back</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {meta?.defaultUserMode
                        ? "Sign in to continue onboarding."
                        : "Your session expired. Sign in to continue where you left off."}
                </p>
            </div>
            {hasAnySsoProvider && !meta?.defaultUserMode && (
                <div className="flex flex-col gap-2">
                    {meta?.ssoProviders.map((provider) => (
                        <button
                            key={provider.id}
                            type="button"
                            onClick={() => handleSso(provider.id)}
                            className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
                        >
                            <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                                <Globe className="size-4 text-muted-foreground" />
                            </div>
                            <span>Continue with {provider.label}</span>
                        </button>
                    ))}
                </div>
            )}
            {passkeyEnabled && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => passkeyMutation.mutate()}
                    disabled={passkeyMutation.isPending}
                >
                    <KeyRound className="size-4 mr-2" />
                    Sign in with passkey
                </Button>
            )}
            {emailPasswordEnabled && (
                <Form
                    form={form}
                    className="flex flex-col gap-4"
                    onSubmit={async (values) => loginMutation.mutateAsync(values)}
                >
                    <FormField
                        control={form.control}
                        name="email"
                        defaultValue=""
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="your@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        defaultValue=""
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <PasswordInput placeholder="Your password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" disabled={loginMutation.isPending}>
                        Sign in
                    </Button>
                </Form>
            )}
        </div>
    );
};
