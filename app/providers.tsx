"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type PropsWithChildren, Suspense } from "react";

import { Toaster } from "@/components/ui/sonner";
import { ErrorLayout } from "@/components/wrappers/common/error-layout";
import { ThemeMetaUpdaterRoot } from "@/features/browser/theme-meta-updater-root";
import { ThemeProvider } from "@/features/theme/theme-provider";

export type ProviderProps = PropsWithChildren<{}>;
const queryClient = new QueryClient();

export const Providers = (props: ProviderProps) => {
  return (
    <Suspense fallback={null}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeMetaUpdaterRoot />
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
