"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import {
  LoginSchema,
  type LoginType,
} from "@/components/wrappers/auth/login/login-form/login-form.schema";
import { ButtonWithLoading } from "@/components/wrappers/common/button/button-with-loading";
import { signIn } from "@/lib/auth/auth-client";

export type loginFormProps = {
  defaultValues?: LoginType;
  isPasskeyEnabled?: boolean;
};

export const LoginForm = (props: loginFormProps) => {
  const { isPasskeyEnabled = false } = props;

  const url = useSearchParams();

  const form = useZodForm({
    schema: LoginSchema,
  });

  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (values: LoginType) => {
      await signIn.email(
        {
          password: values.password,
          email: values.email,
          callbackURL: url?.get("redirect") ?? "/dashboard",
        },
        {
          onSuccess: (context) => {
            if (context.data.twoFactorRedirect) {
              router.push(
                "/guard?redirect=" +
                  encodeURIComponent(context.data.callbackURL || "/dashboard"),
              );
            }

            toast.success("Login success");
          },
          onError: (error) => {
            toast.error(error.error.message);
          },
        },
      );
    },
  });

  return (
    <Form
      form={form}
      className="flex flex-col gap-4 mb-1"
      onSubmit={async (values) => {
        await mutation.mutateAsync(values);
      }}
    >
      <FormField
        control={form.control}
        name="email"
        defaultValue=""
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address</FormLabel>
            <FormControl>
              <Input
                autoComplete="email"
                autoFocus
                placeholder="example@portabase.io"
                {...field}
              />
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
            <div className="flex items-center justify-between">
              <FormLabel>Password</FormLabel>
              <div className="text-center text-sm">
                <Link
                  href={"/forgot-password"}
                  className="hover:underline ml-1"
                >
                  Forgot your password ?
                </Link>
              </div>
            </div>
            <FormControl>
              <PasswordInput
                autoComplete={
                  isPasskeyEnabled
                    ? "current-password webauthn"
                    : "current-password"
                }
                placeholder={"Enter your password"}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <ButtonWithLoading className="mt-2 h-11" isPending={mutation.isPending}>
        Login
      </ButtonWithLoading>
    </Form>
  );
};
