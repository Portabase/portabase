import {CardContent, CardHeader} from "@/components/ui/card";
import {TooltipProvider} from "@/components/ui/tooltip";
import {GuardForm} from "@/components/wrappers/auth/guard/guard-form";
import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {CardAuth} from "@/features/layout/card-auth";

export default async function GuardPage() {

    const cookieStore = await cookies();
    const token = cookieStore.get("better-auth.two_factor")?.value || cookieStore.get("__Secure-better-auth.two_factor")?.value;
    
    if (!token) {
        redirect("/login");
    }

    return (
        <TooltipProvider>
            <CardAuth className="w-full max-w-md">
                <CardHeader>
                    <div className="grid gap-2 text-center mb-2">
                        <h1 className="text-3xl font-bold">Two-factor verification</h1>
                        <p className="text-balance text-muted-foreground">Please enter the verification code generated
                            by your authentication app.</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <GuardForm/>
                </CardContent>
            </CardAuth>
        </TooltipProvider>
    );
}
