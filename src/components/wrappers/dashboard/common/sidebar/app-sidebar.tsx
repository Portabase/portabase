import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator
} from "@/components/ui/sidebar";
import {SidebarLogo} from "@/components/wrappers/dashboard/common/sidebar/logo-sidebar";
import {SidebarMenuCustomMain} from "@/components/wrappers/dashboard/common/sidebar/menu-sidebar-main";
import {SideBarFooterCredit} from "@/components/wrappers/dashboard/common/sidebar/side-bar-footer-credit";
import {OrganizationCombobox} from "@/components/wrappers/dashboard/organization/organization-combobox";
import {env} from "@/env.mjs";
import {LoggedInButton} from "@/components/wrappers/dashboard/common/logged-in/logged-in-button.server";
import {UpdateNotification} from "@/features/updates/components/update-notification";
import {Book} from "lucide-react";

export function AppSidebar() {
    const projectName = env.PROJECT_NAME;
    return (
        <Sidebar collapsible="icon" >
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarLogo projectName={projectName ?? "Portabase"}/>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <OrganizationCombobox/>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenuCustomMain/>
            </SidebarContent>

            <UpdateNotification />

            <SidebarFooter>
                <SidebarSeparator />
                <div className="flex flex-col gap-1 p-2">
                    <a
                        href="https://portabase.io/docs"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:justify-center"
                    >
                        <Book className="size-4 shrink-0" />
                        <span className="group-data-[collapsible=icon]:hidden">Documentation</span>
                    </a>
                </div>

                <SidebarMenu className="mb-2">
                    <SidebarMenuItem className="p-2">
                        <LoggedInButton/>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SideBarFooterCredit/>
            </SidebarFooter>
        </Sidebar>
    );
}
