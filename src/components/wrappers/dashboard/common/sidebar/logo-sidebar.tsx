"use client";

import { useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useEffect, useState } from "react";
import {Skeleton} from "@/components/ui/skeleton";

export const SidebarLogo = ({ projectName }: { projectName: string }) => {
    const { state, isMobile } = useSidebar();
    const { resolvedTheme } = useTheme();

    const [mounted, setMounted] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return(
        <div className="m-4 w-[190px] h-[45px]">
            <Skeleton className="w-full h-full bg-transparent" />
        </div>
    );

    const imageTheme =
        resolvedTheme === "dark" ? "/images/logo-dark.png" : "/images/logo-light.png";

    const handleLoad = () => setLoaded(true);

    const style = {
        transition: "opacity 0.3s ease-in-out",
        opacity: loaded ? 1 : 0,
    };

    return (
        <div className="ml-1 flex items-center justify-center">
            <Link href="/dashboard/home">
                {state === "collapsed" && !isMobile ? (
                    <Image
                        src="/images/logo.png"
                        alt={`Logo ${projectName}`}
                        width={40}
                        height={40}
                        loading="eager"
                        priority
                        style={style}
                        onLoad={handleLoad}
                    />
                ) : (
                    <div className="m-4 w-[190px] h-[45px] ">
                        <Image
                            src={imageTheme}
                            alt={`Logo ${projectName}`}
                            width={190}
                            height={90}
                            loading="eager"
                            priority
                            style={style}
                            onLoad={handleLoad}
                        />
                    </div>
                )}
            </Link>
        </div>
    );
};
