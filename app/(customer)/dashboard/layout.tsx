import React, {ReactNode} from "react";
import {redirect} from "next/navigation";

import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/wrappers/dashboard/common/sidebar/app-sidebar";
import {Header} from "@/features/layout/Header";
import {currentUser} from "@/lib/auth/current-user";
import {ThemeMetaUpdater} from "@/features/browser/theme-meta-updater";

export default async function Layout({children}: { children: ReactNode }) {
    const user = await currentUser();
    if (!user) redirect("/login");

    return (
        <SidebarProvider>
            <div className="flex flex-col lg:flex-row w-full">
                <ThemeMetaUpdater/>
                <AppSidebar/>
                <SidebarInset>
                    <Header/>
                    <main className="h-full">{children}</main>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
