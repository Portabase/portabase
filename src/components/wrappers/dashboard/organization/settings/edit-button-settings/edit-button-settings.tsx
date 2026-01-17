"use client"
import {buttonVariants} from "@/components/ui/button";
import {GearIcon} from "@radix-ui/react-icons";
import Link from "next/link";
import {usePathname} from "next/navigation";

export type EditButtonSettings = {}

export const EditButtonSettings= (props:EditButtonSettings) => {

    const pathname = usePathname();

    return(
        <Link className={buttonVariants({variant: "outline"})}
              href={`${pathname}/edit/`}
        >
            <GearIcon className="w-7 h-7"/>
        </Link>
    )
}