import { CardContent, CardHeader } from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ResetPasswordForm } from "@/components/wrappers/auth/login/reset-password-form/reset-password-form";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@radix-ui/react-avatar";
import { CardAuth } from "@/features/layout/card-auth";
import { env } from "@/env.mjs";

export default async function RoutePage(props: { searchParams: Promise<{ token: string | undefined }> }) {
    if (env.AUTH_EMAIL_PASSWORD_ENABLED !== "true") {
        return redirect("/login");
    }

    const { token } = await props.searchParams;

    if (!token) {
        return redirect(`/login?error=invalid_or_expired_token`);
    }

    const verification = await (await auth.$context).internalAdapter.findVerificationValue(`reset-password:${token}`);

    if (!verification || verification.expiresAt < new Date()) {
        return redirect(`/login?error=invalid_or_expired_token`);
    }

    const user = await (await auth.$context).internalAdapter.findUserById(verification.value);

    return (
        <TooltipProvider>
            <CardAuth className="w-full">
                <CardHeader className="space-y-4">
                    <div className="space-y-1 text-center">
                        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
                        <p className="text-sm text-muted-foreground text-balance">Please enter your new password below.</p>
                    </div>

                    <div className="flex flex-col items-center space-y-2 text-center">
                        <Avatar className="relative flex h-16 w-16 shrink-0 overflow-hidden rounded-full border">
                            <AvatarImage src={user!.image ?? ""} alt={user!.name} className="aspect-square h-full w-full object-cover" />
                            <AvatarFallback className="flex h-full w-full items-center justify-center rounded-full bg-muted text-2xl font-medium text-muted-foreground">
                                {user!.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex flex-col items-center">
                            <div className="font-semibold text-lg">{user!.name}</div>
                            <div className="text-sm text-muted-foreground">{user!.email}</div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <ResetPasswordForm />
                </CardContent>
            </CardAuth>
        </TooltipProvider>
    );
}
