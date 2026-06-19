"use client";

import { useEffect, useState } from "react";
import { useOnboarding } from "@onboardjs/react";
import { useSession } from "@/lib/auth/auth-client";
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
import {
  BaseSchema,
  WithPasswordSchema,
} from "@/features/onboarding/schemas/account.schema";
import { useUpdateAccount } from "@/features/onboarding/hooks/use-update-account";
import type { OnboardingMeta } from "@/features/onboarding/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const StepAccountInfo = () => {
  const { next, state } = useOnboarding();
  const { data: session, refetch: refetchSession } = useSession();
  const meta = state?.context.flowData.meta as OnboardingMeta | undefined;
  const existingAccount = state?.context.flowData.account;
  const isUpdateMode = !!existingAccount;
  const passkeyEnabled = meta?.passkeyEnabled ?? false;
  const emailPasswordEnabled = meta?.emailPasswordEnabled ?? false;

  useEffect(() => {
    if (session?.user && !isUpdateMode) {
      next();
    }
  }, [session?.user?.id, next, session?.user, isUpdateMode]);

  const schema = isUpdateMode
    ? BaseSchema
    : z.object({
        ...BaseSchema.shape,
        password: z.string().optional(),
      });

  const form = useZodForm({ schema }) as unknown as ReturnType<
    typeof useZodForm<typeof WithPasswordSchema>
  >;

  const mutation = useUpdateAccount(refetchSession);

  const onSubmitPassword = async () => {
    const valid = await form.trigger();
    if (!valid) return;
    const values = form.getValues();
    if (!values.password || values.password.length < 8) {
      form.setError("password", { message: "Min. 8 characters" });
      return;
    }
    mutation.mutateAsync({ ...(values as any), method: "password" });
  };

  const onSubmitPasskey = async () => {
    const valid = await form.trigger(["firstName", "lastName", "email"] as any);
    if (!valid) return;
    mutation.mutateAsync({ ...(form.getValues() as any), method: "passkey" });
  };

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
        onSubmit={async (values) => {
          if (isUpdateMode) {
            mutation.mutateAsync({ ...(values as any) });
          } else if (!emailPasswordEnabled) {
            mutation.mutateAsync({ ...(values as any), method: "passkey" });
          } else {
            if (!values.password || (values.password as string).length < 8) {
              form.setError("password", { message: "Min. 8 characters" });
              return;
            }
            mutation.mutateAsync({ ...(values as any), method: "password" });
          }
        }}
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
        {!isUpdateMode && emailPasswordEnabled && (
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
        <div className="flex flex-col gap-2 mt-2">
          {isUpdateMode ? (
            <Button type="submit" disabled={mutation.isPending}>
              Update account
            </Button>
          ) : (
            <>
              {emailPasswordEnabled && (
                <Button type="button" onClick={onSubmitPassword} disabled={mutation.isPending}>
                  Create account
                </Button>
              )}
              {passkeyEnabled && (
                <Button
                  type="button"
                  variant={emailPasswordEnabled ? "outline" : "default"}
                  onClick={onSubmitPasskey}
                  disabled={mutation.isPending}
                >
                  Create account with passkey
                </Button>
              )}
            </>
          )}
        </div>
      </Form>
    </div>
  );
};
