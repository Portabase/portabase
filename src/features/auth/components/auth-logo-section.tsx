"use client";

import {env} from "@/env.mjs";
import {useTheme} from "next-themes";
import Image from "next/image";
import {useEffect, useState} from "react";

export const AuthLogoSection = () => {
    const {resolvedTheme} = useTheme();
    const [mounted, setMounted] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const imageTheme =
        resolvedTheme === "dark"
            ? "/images/logo-dark.png"
            : "/images/logo-light.png";

    const handleLoad = () => setLoaded(true);

    const style = {
        transition: "opacity 0.3s ease-in-out",
        opacity: loaded ? 1 : 0,
    };


    return (
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative flex items-center justify-center h-[160px]">
            {mounted && (
                <Image
                    src={imageTheme}
                    alt="Logo"
                    fill
                    priority
                    className="object-contain p-10"
                    onLoad={handleLoad}
                    style={style}

                />
            )}
        </div>
    );
};
