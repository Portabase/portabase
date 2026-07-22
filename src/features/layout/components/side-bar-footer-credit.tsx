"use client";
import { useSidebar } from "@/components/ui/sidebar";
import { env } from "@/env.mjs";

export type SideBarFooterCreditProps = {};

export const SideBarFooterCredit = (props: SideBarFooterCreditProps) => {
    const { state } = useSidebar();

    return (
        <>
            {state === "expanded" && (
                <div className="text-center mb-2">
                    <h1 className="text-[10px]">Portabase Community Edition v{env.NEXT_PUBLIC_PROJECT_VERSION}</h1>
                </div>
            )}
        </>
    );
};