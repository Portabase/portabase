"use client";

import { useMutation } from "@tanstack/react-query";
import { useOnboarding } from "@onboardjs/react";
import { toast } from "sonner";
import { z } from "zod";
import { authClient, signUp, passkey, signIn } from "@/lib/auth/auth-client";
import { updateAccountAction } from "@/features/onboarding/actions/update-account.action";
import { generatePasskeyContextAction } from "@/features/onboarding/actions/generate-passkey-context.action";
import { WithPasswordSchema } from "@/features/onboarding/schemas/account.schema";

type AccountInput = z.infer<typeof WithPasswordSchema> & {
  method?: "passkey" | "password";
};

export const useUpdateAccount = (refetchSession: () => Promise<any>) => {
  const { state, updateContext, next } = useOnboarding();

  return useMutation({
    mutationFn: async (values: AccountInput) => {
      const existingAccount = state?.context.flowData.account;
      const isUpdateMode = !!existingAccount;
      const selectedMethod = values.method ?? "password";

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

      if (selectedMethod === "passkey") {
        const name = `${values.firstName} ${values.lastName}`;
        const ctxResult = await generatePasskeyContextAction({
          name,
          email: values.email,
        });
        const context = ctxResult?.data;
        if (!context) throw new Error("Failed to generate passkey context");
        const result = await passkey.addPasskey({
          name: values.email,
          context,
        });
        if (result?.error) {
          throw new Error(
            result.error.message ?? "Passkey registration failed",
          );
        }
        await refetchSession();
        const { data: freshSession } = await authClient.getSession();
        if (!freshSession?.user) {
          const signInResult = await (signIn as any).passkey();
          if (signInResult?.error) {
            throw new Error(
              "Registration succeeded but sign-in failed. Please reload and sign in.",
            );
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
            security: { method: "passkey" },
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
    onError: (err: Error) => toast.error(err.message),
  });
};
