import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/features/layout/app-sidebar";
import { Header } from "@/features/layout/header";
import { currentUser } from "@/lib/auth/current-user";
import { ThemeMetaUpdater } from "@/features/theme/theme-meta-updater";

export default async function Layout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <div className="flex flex-col lg:flex-row w-full">
        <ThemeMetaUpdater />
        <AppSidebar />
        <SidebarInset>
          <Header />
          <main className="h-full">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
