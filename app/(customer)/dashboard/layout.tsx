import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/layout/app-sidebar";
import { Header } from "@/features/layout/header";
import { currentUser } from "@/lib/auth/current-user";
import { ThemeMetaUpdater } from "@/features/theme/theme-meta-updater";
import { ModeToggle } from "@/features/theme/mode-toggle";
import { UpdateNotification } from "@/features/updates/update-notification";
import {AclProvider} from "@/lib/acl/acl-context";
import {env} from "@/env.mjs";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  const isDemoEnabled = env.DEMO_ENABLED

  return (
    <SidebarProvider>
      <AclProvider demo={isDemoEnabled} user={user}>
        <div className="flex flex-col lg:flex-row w-full">
          <ThemeMetaUpdater />
          <AppSidebar updateNotification={<UpdateNotification />} />
          <SidebarInset>
            <Header actions={<ModeToggle />} />
            <main className="h-full">{children}</main>
          </SidebarInset>
        </div>
      </AclProvider>
    </SidebarProvider>
  );
}
