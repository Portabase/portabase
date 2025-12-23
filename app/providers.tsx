"use client";

import {PropsWithChildren, Suspense} from "react";
import {ThemeProvider} from "@/features/theme/theme-provider";

import {Toaster} from "@/components/ui/sonner";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";


export type ProviderProps = PropsWithChildren<{}>;
const queryClient = new QueryClient();

export const Providers = (props: ProviderProps) => {
    return (
        <Suspense fallback={null}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
            >
                <QueryClientProvider client={queryClient}>
                    <Toaster/>
                    {props.children}
                </QueryClientProvider>
            </ThemeProvider>
        </Suspense>
    );
};
