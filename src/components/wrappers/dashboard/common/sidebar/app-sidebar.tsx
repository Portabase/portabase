import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import {SidebarLogo} from "@/components/wrappers/dashboard/common/sidebar/logo-sidebar";
import {SidebarMenuCustomMain} from "@/components/wrappers/dashboard/common/sidebar/menu-sidebar-main";
import {SideBarFooterCredit} from "@/components/wrappers/dashboard/common/sidebar/side-bar-footer-credit";
import {OrganizationCombobox} from "@/components/wrappers/dashboard/organization/organization-combobox";
import {env} from "@/env.mjs";
import {LoggedInButton} from "@/components/wrappers/dashboard/common/logged-in/logged-in-button.server";
import {UpdateNotification} from "@/features/updates/components/update-notification";

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
            
            <SidebarMenu className="mb-2">
                <SidebarMenuItem className="p-2">
                    <LoggedInButton/>
                </SidebarMenuItem>
            </SidebarMenu>
            <SideBarFooterCredit/>
        </Sidebar>
    );
}
