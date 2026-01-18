import {Server} from "lucide-react";
import type {SVGProps} from "react";
import {ProviderIconTypes} from "@/components/wrappers/dashboard/admin/channels/helpers/common";

export const storageProviders: ProviderIconTypes[] = [
    {value: "local", label: "Local", icon: Server},
    {value: "s3", label: "s3", icon: S3Icon},
]

export function S3Icon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={256} height={199}  {...props} viewBox="0 0 24 24">
            <path fill="currentColor"
                  d="M13.207.006a2.16 2.16 0 0 0-1.62.582a2.15 2.15 0 0 0-.095 3.035l3.408 3.55a3.042 3.042 0 0 1-.663 4.688l-.463.239V7.285a15.42 15.42 0 0 0-8.018 10.487v.017l6.549-3.328v7.621L13.779 24V13.682l.897-.463a4.443 4.443 0 0 0 1.22-7.03l-3.37-3.525a.75.75 0 0 1 .037-1.055a.75.75 0 0 1 1.056.038l.467.486l-.006.006l4.07 4.244a.057.057 0 0 0 .082 0a.06.06 0 0 0 0-.07l-3.14-5.143l-.149.143l.149-.145C14.494.393 13.829.054 13.207.006m-.902 9.865v2.994l-4.152 2.149a14 14 0 0 1 2.767-3.928a14 14 0 0 1 1.385-1.215"/>
        </svg>
    );
}

