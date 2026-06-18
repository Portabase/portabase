import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/layout/app-sidebar";
import { Header } from "@/features/layout/header";
import { currentUser } from "@/lib/auth/current-user";
import { isOnboardingDone } from "@/features/onboarding/is-onboarding-done";
import { ThemeMetaUpdater } from "@/features/theme/theme-meta-updater";
import { ModeToggle } from "@/features/theme/mode-toggle";
import { UpdateNotification } from "@/features/updates/update-notification";

export default async function Layout({ children }: { children: ReactNode }) {
  if (!(await isOnboardingDone())) {
    redirect("/welcome");
  }

  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <div className="flex flex-col lg:flex-row w-full">
        <ThemeMetaUpdater />
        <AppSidebar updateNotification={<UpdateNotification />} />
        <SidebarInset>
          <Header actions={<ModeToggle />} />
          <main className="h-full">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
