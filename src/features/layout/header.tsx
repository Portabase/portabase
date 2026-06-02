import { ReactNode } from "react";
import {notFound} from "next/navigation";
import {SidebarTrigger} from "@/components/ui/sidebar";
import {currentUser} from "@/lib/auth/current-user";
import {BreadCrumbsWrapper} from "@/components/common/bread-crumbs";
import GitHubStarsButtonCustom from "@/components/common/github-button";
import {LoggedInButton} from "@/features/layout/logged-in-button.server";
import { env } from "@/env.mjs";
import { DemoResetBanner } from "@/features/layout/demo-reset-banner";

export const Header = async ({ actions }: { actions?: ReactNode } = {}) => {
    const user = await currentUser();
    if (!user) {
        return notFound();
    }
    const demoEnabled = env.DEMO_ENABLED;
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center justify-between">
                <SidebarTrigger className="-ml-1"/>
                <BreadCrumbsWrapper/>
            </div>
            <div className="flex items-center gap-2">
                {demoEnabled && <DemoResetBanner />}
                <GitHubStarsButtonCustom/>
                {actions}
                <LoggedInButton/>
            </div>
        </header>
    );
};
