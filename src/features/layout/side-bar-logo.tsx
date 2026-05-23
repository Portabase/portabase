"use client";
import {useSidebar} from "@/components/ui/sidebar";
import {useTheme} from "next-themes";
import Image from "next/image";
import Link from "next/link";

export type SideBarLogoProps = {};

export const SideBarLogo = (props: SideBarLogoProps) => {
    const {state, isMobile} = useSidebar();
    const {resolvedTheme} = useTheme();
    return state === "collapsed" && !isMobile ? (
        <Link href={"/dashboard"}>

            <div className="flex items-center justify-center">
                <Image
                    src={"/images/logo/picto.png"}
                    alt="Logo"
                    width={32}
                    height={32}
                    loading="eager"
                    className="object-contain"
                />
            </div>
        </Link>
    ) : (
        <Link href={"/dashboard"}>

        <div className="w-full h-auto p-4 flex items-center justify-center">
            <Image
                loading="eager"
                src={"/images/logo/logo.png"}
                alt="Logo"
                width={190}
                height={190}
                className="object-contain"
            />
        </div>
        </Link>
    );
};
