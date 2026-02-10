"use client";

import { useEffect, useState } from "react";
import { CheckIcon, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function copyToClipboardWithMeta(value: string) {
    navigator.clipboard.writeText(value);
}

export type CopyButtonProps = {
    value: string;
    className?: string;
};

export const CopyButton = (props: CopyButtonProps) => {
    const { value } = props;

    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setHasCopied(false);
        }, 2000);
    }, [hasCopied]);

    return (
        <Button
            onClick={() => {
                copyToClipboardWithMeta(value);
                setHasCopied(true);
            }}
            {...props}
        >
            <span className="mr-2">Copy</span>
            {hasCopied ? <CheckIcon /> : <Copy size="18" />}
        </Button>
    );
};
