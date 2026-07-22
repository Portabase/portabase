import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/layout/components/app-sidebar";
import { Header } from "@/features/layout/components/header";
import { currentUser } from "@/lib/auth/current-user";
import { ThemeMetaUpdater } from "@/features/theme/theme-meta-updater";
import {AclProvider} from "@/lib/acl/acl-context";
import { isOnboardingDone } from "@/db/services/setting";
import { env } from "@/env.mjs";
import { ModeToggle } from "@/features/theme/components/mode-toggle";
import { UpdateNotification } from "@/features/updates/components/update-notification";

export default async function Layout({ children }: { children: ReactNode }) {
  if (env.SKIP_ONBOARDING !== "true" && !(await isOnboardingDone())) {
    redirect("/welcome");
  }
  const isDemoEnabled = env.DEMO_ENABLED

  const user = await currentUser();
  if (!user) redirect("/login");

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
