"use client";

import { useEffect } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  useZodForm,
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { authClient, signUp, passkey, useSession, signIn } from "@/lib/auth/auth-client";
import { updateAccountAction } from "@/features/onboarding/actions/update-account.action";
import { generatePasskeyContextAction } from "@/features/onboarding/actions/generate-passkey-context.action";
import type { OnboardingMeta } from "@/features/onboarding/onboarding.types";

const BaseSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Invalid email"),
});

const WithPasswordSchema = BaseSchema.extend({
  password: z.string().min(8, "Min. 8 characters"),
});

export const StepAccountInfo = () => {
  const { next, updateContext, state } = useOnboarding();
  const { data: session, refetch: refetchSession } = useSession();
  const meta = state?.context.flowData.meta as OnboardingMeta | undefined;
  const existingAccount = state?.context.flowData.account;
  const isUpdateMode = !!existingAccount;
  const passkeyEnabled = meta?.passkeyEnabled ?? false;

  // Already authenticated (e.g. came from passkey welcome-back login) — skip account creation
  useEffect(() => {
    if (session?.user && !isUpdateMode) {
      next();
    }
  }, [session?.user?.id]);

  const schema = passkeyEnabled ? BaseSchema : WithPasswordSchema;
  const form = useZodForm({ schema }) as unknown as ReturnType<
    typeof useZodForm<typeof WithPasswordSchema>
  >;

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof WithPasswordSchema>) => {
      if (isUpdateMode) {
        const result = await updateAccountAction({
          firstName: values.firstName,
          lastName: values.lastName,
        });
        if (!result?.data) throw new Error("Failed to update account");
        await updateContext({
          flowData: {
            ...state?.context.flowData,
            account: {
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
            },
          },
        });
        await next();
        return;
      }

      if (passkeyEnabled) {
        const name = `${values.firstName} ${values.lastName}`;
        const context = await generatePasskeyContextAction(name, values.email);
        const result = await passkey.addPasskey({
          name: values.email,
          context,
        });
        if (result?.error) {
          toast.error(result.error.message ?? "Passkey registration failed");
          return;
        }
        // Verify session is set; if not, trigger explicit sign-in
        await refetchSession();
        const { data: freshSession } = await authClient.getSession();
        if (!freshSession?.user) {
          const signInResult = await (signIn as any).passkey();
          if (signInResult?.error) {
            toast.error("Registration succeeded but sign-in failed. Please reload and sign in.");
            return;
          }
        }
        await updateContext({
          flowData: {
            ...state?.context.flowData,
            account: {
              firstName: values.firstName,
              lastName: values.lastName,
              email: values.email,
            },
          },
        });
        await next();
        return;
      }

      await signUp.email(
        {
          name: `${values.firstName} ${values.lastName}`,
          email: values.email,
          password: values.password ?? "",
        } as any,
        {
          onSuccess: async () => {
            await updateContext({
              flowData: {
                ...state?.context.flowData,
                account: {
                  firstName: values.firstName,
                  lastName: values.lastName,
                  email: values.email,
                },
              },
            });
            await next();
          },
          onError: (error) => {
            toast.error(error.error.message);
          },
        },
      );
    },
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">
          {isUpdateMode ? "Update your account" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          This step can&apos;t be skipped.
        </p>
      </div>
      <Form
        form={form}
        className="flex flex-col gap-4"
        onSubmit={async (values) => mutation.mutateAsync(values as any)}
      >
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            defaultValue={existingAccount?.firstName ?? ""}
            render={({ field }) => (
              <FormItem>
                <FormLabel>First name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            defaultValue={existingAccount?.lastName ?? ""}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          defaultValue={existingAccount?.email ?? ""}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {!passkeyEnabled && !isUpdateMode && (
          <FormField
            control={form.control}
            name="password"
            defaultValue=""
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="Min. 8 characters" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {isUpdateMode
            ? "Update account"
            : passkeyEnabled
              ? "Create account with passkey"
              : "Create account"}
        </Button>
      </Form>
    </div>
  );
};
