"use client";

import {PropsWithChildren, useState} from "react";
import {Button} from "@/components/ui/button";
import {Check, Copy, Terminal} from "lucide-react";
import {copyToClipboardWithMeta} from "@/components/wrappers/common/button/copy-button";
import {cn} from "@/lib/utils";

export type CodeSnippetProps = PropsWithChildren<{
    code: string;
    title?: string;
    className?: string;
}>;

export const CodeSnippet = (props: CodeSnippetProps) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        await copyToClipboardWithMeta(props.code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={cn("relative group rounded-md bg-muted/50 border overflow-hidden", props.className)}>
            {props.title && (
                <div className="flex items-center px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                    {props.title}
                </div>
            )}
            <div className="flex items-center p-4">
                 <pre className="flex-1 overflow-x-auto font-mono text-sm leading-relaxed">
                    <code className="break-all whitespace-pre-wrap">{props.code}</code>
                </pre>
                <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                    onClick={handleCopy}
                >
                    {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    <span className="sr-only">Copy code</span>
                </Button>
            </div>
        </div>
    );
};
