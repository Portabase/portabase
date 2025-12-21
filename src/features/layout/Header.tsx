import {notFound} from "next/navigation";

import {SidebarTrigger} from "@/components/ui/sidebar";
import {ModeToggle} from "@/features/theme/ModeToggle";
import {currentUser} from "@/lib/auth/current-user";
import {BreadCrumbsWrapper} from "@/components/wrappers/common/bread-crumbs/bread-crumbs";
import GitHubStarsButtonCustom from "@/components/wrappers/common/github/github-button";
import {LoggedInButton} from "@/components/wrappers/dashboard/common/logged-in/logged-in-button";

export const Header = async () => {
    const user = await currentUser();
    if (!user) {
        return notFound();
    }
    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-4">
            <div className="flex items-center justify-between">
                <SidebarTrigger className="-ml-1"/>
                <BreadCrumbsWrapper/>
            </div>

            <div className="flex items-center gap-2">
                <GitHubStarsButtonCustom/>
                <ModeToggle/>
                <LoggedInButton/>
            </div>
        </header>
    );
};
