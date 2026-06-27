"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, Suspense } from "react";

import { Toaster } from "@/components/ui/sonner";
import { ErrorLayout } from "@/components/common/error-layout";
import { ThemeMetaUpdater } from "@/features/theme/components/theme-meta-updater";
import { ThemeProvider } from "@/features/theme/components/theme-provider";

export type ProviderProps = PropsWithChildren<{}>;
const queryClient = new QueryClient();

export const Providers = (props: ProviderProps) => {
  return (
    <Suspense fallback={null}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeMetaUpdater />
        <QueryClientProvider client={queryClient}>
          <ErrorLayout>
            <Toaster />
            {props.children}
          </ErrorLayout>
        </QueryClientProvider>
      </ThemeProvider>
    </Suspense>
  );
};
