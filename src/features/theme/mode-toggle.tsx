"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { authClient } from "@/lib/auth/auth-client"
import { motion } from "motion/react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

const themes = [
    { id: "light", icon: Sun, label: "Light" },
    { id: "system", icon: Monitor, label: "System" },
    { id: "dark", icon: Moon, label: "Dark" },
] as const

export function ModeToggle() {
    const { theme } = useTheme()


    const currentIndex = themes.findIndex((t) => t.id === theme)
    const activeIndex = currentIndex === -1 ? 1 : currentIndex

    const handleThemeChange = async (newTheme: "light" | "system" | "dark") => {
        await authClient.updateUser({ theme: newTheme })
    }

    return (
        <div className="flex items-center justify-center rounded-full bg-muted/50 p-1 border border-border/50 relative w-fit">
            <motion.div
                className="absolute h-7 w-8 rounded-full bg-background shadow-sm z-0 border border-border/20"
                initial={false}
                animate={{ x: activeIndex * 32 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{ left: "4px" }}
            />

            <div className="flex gap-0 relative z-10">
                {themes.map((t) => {
                    const Icon = t.icon
                    const isActive = theme === t.id
                    
                    return (
                        <button
                            key={t.id}
                            onClick={() => handleThemeChange(t.id)}
                            className={cn(
                                "flex h-7 w-8 items-center justify-center rounded-full transition-colors duration-200 hover:text-foreground outline-none",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                            aria-label={t.label}
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    )
                })}
            </div>
        </div>
    )
}