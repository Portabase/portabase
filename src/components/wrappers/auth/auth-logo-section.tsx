"use client";

import {env} from "@/env.mjs";
import {useTheme} from "next-themes";
import Image from "next/image";
import {useEffect, useState} from "react";

export const AuthLogoSection = () => {
    const {resolvedTheme} = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const imageTheme =
        resolvedTheme === "dark"
            ? "/images/logo-white.png"
            : "/images/logo-black.png";

    return (
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative flex items-center justify-center h-[160px]">
            {mounted && (
                <Image
                    src={imageTheme}
                    alt="Logo"
                    fill
                    priority
                    className="object-contain p-10"
                />
            )}
            <span className="absolute bottom-12 right-2 text-sm text-muted-foreground">
                v{env.NEXT_PUBLIC_PROJECT_VERSION}
            </span>
        </div>
    );
};
