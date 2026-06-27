"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@onboardjs/react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Globe, Mail, KeyRound, ShieldAlert } from "lucide-react";
import { Icon } from "@iconify/react";
import Image from "next/image";
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
  email: z.email("Invalid email"),
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
  const hasAnyOAuthProvider = (meta?.oauthProviders?.length ?? 0) > 0;
  const hasAnyAuthMethod =
    emailPasswordEnabled || passkeyEnabled || hasAnySsoProvider || hasAnyOAuthProvider;

  useEffect(() => {
    if (session?.user) {
      router.push("/welcome");
    }
  }, [session?.user, router]);

  const form = useZodForm({ schema: LoginSchema });

  const passkeyMutation = useMutation({
    mutationFn: async () => {
      const result = await (signIn as any).passkey();
      if (result?.error)
        throw new Error(result.error.message ?? "Passkey sign in failed");
      router.push("/welcome");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (values: LoginValues) => {
      const result = await signIn.email({
        email: values.email,
        password: values.password,
      });
      if (result.error)
        throw new Error(result.error.message ?? "Sign in failed");
      router.push("/welcome");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleOAuth = async (providerId: string) => {
    const result = await signIn.social({
      provider: providerId as any,
      callbackURL: "/welcome",
    });
    if (result?.error)
      toast.error(result.error.message ?? "OAuth sign in failed");
  };

  const handleSso = async (providerId: string) => {
    const result = await signIn.sso({
      providerId,
      providerType: "oidc",
      callbackURL: "/welcome",
    });
    if (result?.error)
      toast.error(result.error.message ?? "SSO sign in failed");
  };

  if (!hasAnyAuthMethod) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 gap-4">
        <div className="p-4 rounded-full bg-yellow-500/10 mb-2">
          <ShieldAlert className="size-8 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Configuration needed</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-70 mx-auto">
            Please enable an authentication method in your environment variables
            to continue.
          </p>
        </div>
        <div className="text-left mt-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-600 dark:text-yellow-400 max-w-sm w-full">
          <p className="font-medium mb-2">Set at least one of these:</p>
          <ul className="space-y-1">
            <li>
              •{" "}
              <code className="font-mono text-xs">
                AUTH_EMAIL_PASSWORD_ENABLED=true
              </code>
            </li>
            <li>
              •{" "}
              <code className="font-mono text-xs">
                AUTH_PASSKEY_ENABLED=true
              </code>
            </li>
            <li>• Or configure an SSO provider</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!meta?.hasExistingUsers) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Welcome to Portabase</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set up your instance by creating the first account.
          </p>
        </div>
        {(hasAnySsoProvider || hasAnyOAuthProvider) && (
          <div className="flex flex-col gap-2">
            {meta?.ssoProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleSso(provider.id)}
                className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
              >
                <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                  {provider.icon ? (
                    provider.icon.startsWith("/") || provider.icon.startsWith("http") ? (
                      <Image
                        src={provider.icon}
                        alt={provider.label || "icon"}
                        width={16}
                        height={16}
                        className="size-4"
                        unoptimized={provider.icon.startsWith("http")}
                      />
                    ) : (
                      <Icon icon={provider.icon} className="size-4" />
                    )
                  ) : (
                    <Globe className="size-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col items-start text-left">
                  <span>Continue with {provider.label}</span>
                  {provider.description && (
                    <span className="text-xs text-muted-foreground">{provider.description}</span>
                  )}
                </div>
              </button>
            ))}
            {meta?.oauthProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => handleOAuth(provider.id)}
                className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
              >
                <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                  <Icon icon={provider.icon} className="size-4" />
                </div>
                <span>Continue with {provider.label}</span>
              </button>
            ))}
          </div>
        )}
        {(emailPasswordEnabled || passkeyEnabled) && (
          <Button type="button" onClick={() => next()}>
            {passkeyEnabled && !emailPasswordEnabled ? (
              <KeyRound className="size-4 mr-2" />
            ) : (
              <Mail className="size-4 mr-2" />
            )}
            {emailPasswordEnabled && passkeyEnabled
              ? "Register account"
              : passkeyEnabled
                ? "Register with passkey"
                : "Register with email"}
          </Button>
        )}
      </div>
    );
  }

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
      {(hasAnySsoProvider || hasAnyOAuthProvider) && !meta?.defaultUserMode && (
        <div className="flex flex-col gap-2">
          {meta?.ssoProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleSso(provider.id)}
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
            >
              <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                {provider.icon ? (
                  <Icon icon={provider.icon} className="size-4" />
                ) : (
                  <Globe className="size-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex flex-col items-start text-left">
                <span>Continue with {provider.label}</span>
                {provider.description && (
                  <span className="text-xs text-muted-foreground">{provider.description}</span>
                )}
              </div>
            </button>
          ))}
          {meta?.oauthProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => handleOAuth(provider.id)}
              className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm hover:bg-accent/50 hover:border-primary/20 transition-colors w-full"
            >
              <div className="size-9 rounded-md border bg-muted/50 shadow-sm flex items-center justify-center shrink-0">
                <Icon icon={provider.icon} className="size-4" />
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
