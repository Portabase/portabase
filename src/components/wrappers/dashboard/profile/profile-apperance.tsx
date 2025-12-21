"use client";

import React from "react";
import {cn} from "@/lib/utils";
import {useTheme} from "next-themes";
import {authClient} from "@/lib/auth/auth-client";

const themes = [{value: "light"}, {value: "dark"}, {value: "system"}];

export function ProfileAppearance() {

    return (
        <div className="space-y-8 animate-in fade-in-50 duration-300 ">
            <div className="mb-6 space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Appearance Settings</h2>
                <p className="text-sm text-muted-foreground">Customize the look and feel of your dashboard.</p>
            </div>
            <ThemeSelector/>
        </div>
    );
}

function ThemeSelector() {
    const {theme, setTheme} = useTheme();


    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            {themes.map((item) => {
                const isDark = item.value === "dark";
                const isSystem = item.value === "system";
                const isActive = theme === item.value;

                return (
                    <div
                        key={item.value}
                        className={cn(
                            "border-2 rounded-xl p-1 cursor-pointer transition-all hover:bg-accent/50 space-y-2",
                            isActive ? "border-primary bg-primary/5" : "border-muted/40"
                        )}
                        onClick={async () => {
                            // setTheme(item.value)
                            // await authClient.updateUser({theme: item.value});
                        }}
                    >
                        <div
                            className={cn(
                                "p-2 rounded-lg aspect-[4/3] flex flex-col gap-2 relative overflow-hidden border",
                                isDark ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200",
                                isSystem && "bg-gradient-to-br from-white to-slate-950"
                            )}
                        >
                            <div
                                className={cn("h-3 w-full rounded-sm shadow-sm opacity-80", isDark ? "bg-slate-800" : "bg-slate-100")}/>
                            <div className="flex gap-2 flex-1 relative">
                                <div
                                    className={cn("w-1/4 h-full rounded-sm shadow-sm opacity-80", isDark ? "bg-slate-800" : "bg-slate-100")}/>
                                <div className="flex-1 flex flex-col gap-2">
                                    <div
                                        className={cn("h-3 w-full rounded-sm shadow-sm opacity-80", isDark ? "bg-slate-800" : "bg-slate-100")}/>
                                    <div
                                        className={cn("flex-1 rounded-sm shadow-sm p-1 space-y-2 opacity-50", isDark ? "bg-slate-800" : "bg-slate-100")}>
                                        <div
                                            className={cn("h-2 w-3/4 rounded-full", isDark ? "bg-slate-700" : "bg-slate-300")}/>
                                        <div
                                            className={cn("h-2 w-full rounded-full", isDark ? "bg-slate-700" : "bg-slate-300")}/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-1 px-2">
                            <span className="font-medium text-sm">{THEME_TEXT[item.value as ThemeKey]}</span>
                            <div
                                className={cn(
                                    "w-4 h-4 rounded-full border flex items-center justify-center transition-all",
                                    isActive ? "border-primary bg-primary" : "border-muted-foreground/30"
                                )}
                            >
                                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground"/>}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

type ThemeKey = "dark" | "light" | "system";


const THEME_TEXT: Record<ThemeKey, string> = {
    dark: "Dark",
    light: "Light",
    system: "System",
};