"use client";

import {useTheme} from "next-themes";
import {useEffect, useState} from "react";
import {authClient} from "@/lib/auth/auth-client";

export function ThemeMetaUpdater() {
    const {setTheme, resolvedTheme} = useTheme();
    const {data: session, isPending} = authClient.useSession();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isPending || !session?.user?.theme) return;
        setTheme(session.user.theme);
    }, [session, isPending, setTheme]);

    useEffect(() => {
        if (!mounted || !resolvedTheme) return;

        const color = resolvedTheme === "dark" ? "#000000" : "#ffffff";
        let tag = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
        if (!tag) {
            tag = document.createElement("meta");
            tag.name = "theme-color";
            document.head.appendChild(tag);
        }
        tag.content = color;
    }, [mounted, resolvedTheme]);

    return null;
}
