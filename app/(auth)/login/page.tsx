import {LoginForm} from "@/components/wrappers/auth/login/login-form/login-form";
import {Metadata} from "next";
import {SUPPORTED_PROVIDERS} from "../../../portabase.config";
import {SocialAuthButtons} from "@/components/wrappers/auth/social-buttons";
import {TooltipProvider} from "@/components/ui/tooltip";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import Link from "next/link";
import {Separator} from "@/components/ui/separator";

export const metadata: Metadata = {
    title: "Login",
};

export default async function SignInPage() {

    return (
        <TooltipProvider>
            <Card className="w-full">
                <CardHeader>
                    <div className="grid gap-2 text-center mb-2">
                        <h1 className="text-3xl font-bold">Login</h1>
                        <p className="text-balance text-muted-foreground">Fill your login informations</p>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <LoginForm />

                    {SUPPORTED_PROVIDERS.filter((p) => !p.isManual).length > 0 && (
                        <>

                            <div className="relative my-4 flex items-center justify-center overflow-hidden">
                                <Separator/>
                                <div className="px-2 text-center bg-card text-sm">OR</div>
                                <Separator/>
                            </div>

                            <SocialAuthButtons />
                        </>
                    )}

                    <div className="mt-4 text-center text-sm">
                        Don&apos;t have an account ?{" "}
                        <Link href="/register" className="underline">
                            Sign up
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>




    )
}
