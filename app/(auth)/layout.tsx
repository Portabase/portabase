import React from "react";
import {redirect} from "next/navigation";
import {currentUser} from "@/lib/auth/current-user";
import {AuthLogoSection} from "@/components/wrappers/auth/auth-logo-section";
import {env} from "@/env.mjs";
import {Heart} from "lucide-react";

export default async function Layout({children}: { children: React.ReactNode }) {

    const user = await currentUser();

    if (user && !user.banned && user.role !== "pending") {
        redirect("/dashboard/home");
    }

    return (
        <div className="flex min-h-screen flex-col justify-between py-10 sm:px-6 lg:px-8 ">
            <div className="flex flex-col items-center justify-center flex-1">
                <div className="mx-auto w-full max-w-md">
                    <AuthLogoSection/>
                    <div className="mt-4">{children}</div>
                </div>
            </div>
            <footer className="mt-8 text-center text-xs text-muted-foreground flex flex-col gap-1">
                <p className="flex items-center justify-center gap-1">
                    Made with <Heart className="size-3 fill-red-500 text-red-500" /> by <span className="font-medium text-foreground">Portabase</span>
                </p>
                <p>v{env.NEXT_PUBLIC_PROJECT_VERSION}</p>
            </footer>
        </div>
    )
}