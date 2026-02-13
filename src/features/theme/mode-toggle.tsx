"use client"
import { Moon, Sun, Check, SunMoon } from "lucide-react"
import { useTheme } from "next-themes"
import { authClient } from "@/lib/auth/auth-client"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const themes = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "dark", icon: Moon, label: "Dark" },
    { id: "system", icon: SunMoon, label: "System" },
] as const

export function ModeToggle() {
    const { theme } = useTheme()

    const handleThemeChange = async (newTheme: "light" | "system" | "dark") => {
        await authClient.updateUser({ theme: newTheme })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8 rounded-full border border-input bg-transparent shadow-xs transition-transform active:scale-95">
                    {theme === "light" ? <Sun className="size-4" /> : theme === "dark" ? <Moon className="size-4" /> : <SunMoon className="size-4" />}
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-37.5 rounded-xl border-2 border-border p-1 shadow-none">
                {themes.map((t) => {
                    const ThemeIcon = t.icon
                    const isActive = theme === t.id
                    return (
                        <DropdownMenuItem
                            key={t.id}
                            onClick={() => handleThemeChange(t.id)}
                            className={cn(
                                "group gap-2 p-2 cursor-pointer rounded-lg mb-1 last:mb-0 transition-colors",
                                isActive
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "focus:bg-accent hover:bg-accent/50 border border-transparent"
                            )}
                        >
                            <div className={cn(
                                "flex size-7 shrink-0 items-center justify-center rounded-md border shadow-sm transition-all group-hover:shadow-md",
                                isActive ? "bg-primary text-primary-foreground border-primary/30" : "bg-muted/50 border-border"
                            )}>
                                <ThemeIcon className={cn(
                                    "size-4",
                                    isActive ? "text-primary-foreground" : "text-muted-foreground"
                                )} />
                            </div>
                            <span className={cn(
                                "text-sm font-medium leading-none flex-1",
                                isActive ? "text-primary" : ""
                            )}>
                                {t.label}
                            </span>
                            {isActive && (
                                <div className="flex size-4 items-center justify-center rounded-full bg-primary shadow-sm ml-auto">
                                    <Check className="size-2.5 text-primary-foreground" strokeWidth={3} />
                                </div>
                            )}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}