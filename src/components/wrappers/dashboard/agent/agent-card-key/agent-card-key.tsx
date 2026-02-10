"use client";

import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Button} from "@/components/ui/button";
import {Copy, Check} from "lucide-react";
import {useState} from "react";
import {copyToClipboardWithMeta} from "@/components/wrappers/common/button/copy-button";

export type AgentCardKeyProps = {
    edgeKey: string;
    agentName: string;
};

export const AgentCardKey = ({edgeKey, agentName}: AgentCardKeyProps) => {
    const [isCopiedKey, setIsCopiedKey] = useState(false);
    const [isCopiedCommand, setIsCopiedCommand] = useState(false);

    const command = `portabase agent "${agentName}" --key ${edgeKey}`;

    const handleCopy = async (text: string, setter: (v: boolean) => void) => {
        await copyToClipboardWithMeta(text);
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
        event.target.select();
    };

    return (
        <div className="grid gap-6 py-2">
            <div className="space-y-4">
                <div className="flex flex-col gap-2">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        1. Registration Key
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={edgeKey}
                            onFocus={handleFocus}
                            className="font-mono text-xs bg-muted/30 focus-visible:ring-1 cursor-pointer"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(edgeKey, setIsCopiedKey)}
                            className="shrink-0"
                            type="button"
                        >
                            {isCopiedKey ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Use this key for manual configuration of your agent.
                    </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        2. Automatic Setup (CLI)
                    </Label>
                    <div className="flex items-center gap-2">
                        <Input
                            readOnly
                            value={command}
                            onFocus={handleFocus}
                            className="font-mono text-xs bg-muted/30 focus-visible:ring-1 cursor-pointer"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(command, setIsCopiedCommand)}
                            className="shrink-0"
                            type="button"
                        >
                            {isCopiedCommand ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                        Run this command on your server to automatically register the agent.
                    </p>
                </div>
            </div>
        </div>
    );
};
