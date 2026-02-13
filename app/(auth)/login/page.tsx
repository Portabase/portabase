import { LoginForm } from "@/components/wrappers/auth/login/login-form/login-form";
import { Metadata } from "next";
import { SUPPORTED_PROVIDERS } from "@/lib/auth/config";
import { SocialAuthButtons } from "@/components/wrappers/auth/social-buttons";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { CardAuth } from "@/features/layout/card-auth";
import { env } from "@/env.mjs";

export const metadata: Metadata = {
    title: "Login",
};

export default async function SignInPage() {
    return (
        <TooltipProvider>
            <CardAuth className="w-full">
                <CardHeader>
                    <div className="grid gap-2 text-center mb-2">
                        <h1 className="text-3xl font-bold">Login</h1>
                        <p className="text-balance text-muted-foreground">Fill your login informations</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {env.AUTH_EMAIL_PASSWORD_ENABLED === "true" && <LoginForm isPasskeyEnabled={env.AUTH_PASSKEY_ENABLED === "true"} />}

                    {env.AUTH_EMAIL_PASSWORD_ENABLED === "true" && SUPPORTED_PROVIDERS.filter((p) => !p.isManual && p.isActive).length > 0 && (
                        <div className="relative my-4 flex items-center justify-center overflow-hidden">
                            <Separator />
                            <div className="px-2 text-center  text-sm">OR</div>
                            <Separator />
                        </div>
                    )}

                    {SUPPORTED_PROVIDERS.filter((p) => !p.isManual && p.isActive).length > 0 && <SocialAuthButtons providers={SUPPORTED_PROVIDERS} />}

                    {env.AUTH_SIGNUP_ENABLED === "true" && (
                        <div className="mt-4 text-center text-sm">
                            Don&apos;t have an account ?{" "}
                            <Link href="/register" className="underline">
                                Sign up
                            </Link>
                        </div>
                    )}
                </CardContent>
            </CardAuth>
        </TooltipProvider>
    );
}
