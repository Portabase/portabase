import {CardContent, CardHeader} from "@/components/ui/card";

import {TooltipProvider} from "@/components/ui/tooltip";
import {ForgotPasswordForm} from "@/components/wrappers/auth/login/forgot-password-form/forgot-password-form";
import {CardAuth} from "@/features/layout/card-auth";

export default async function RoutePage(props: { searchParams: Promise<{ callbackUrl: string | undefined }> }) {

    return (
        <TooltipProvider>
            <CardAuth className="w-full">
                <CardHeader>
                    <div className="grid gap-2 text-center mb-2">
                        <h1 className="text-3xl font-bold">Reset password</h1>
                        <p className="text-balance text-muted-foreground">Enter your email address and we'll send you a
                            link to reset your password.</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <ForgotPasswordForm/>
                </CardContent>
            </CardAuth>
        </TooltipProvider>
    );
}
