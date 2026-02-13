"use client";

import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Copy, Check, Eye, EyeOff, Terminal, Key, Info} from "lucide-react";
import {useState} from "react";
import {copyToClipboardWithMeta} from "@/components/wrappers/common/button/copy-button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

export type AgentCardKeyProps = {
    edgeKey: string;
    agentName: string;
};

export const AgentCardKey = ({edgeKey, agentName}: AgentCardKeyProps) => {
    const [isCopiedKey, setIsCopiedKey] = useState(false);
    const [isCopiedCommand, setIsCopiedCommand] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const command = `portabase agent "${agentName}" --key ${edgeKey}`;
    const maskedKey = "••••••••••••••••••••••••••••••••";

    const handleCopy = async (text: string, setter: (v: boolean) => void) => {
        await copyToClipboardWithMeta(text);
        setter(true);
    };

    return (
        <div className="flex flex-col gap-4 py-2">
                    <Card className="border-muted/60 shadow-none py-0">
                        <CardHeader className="px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-tight">
                                CLI Setup
                            </CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                To setup your agent using the CLI, copy the command below and paste it in your terminal.
                                Make sure you have the PortaBase CLI installed. If not, you can <a href="https://portabase.io/docs/cli" target="_blank" className="underline hover:text-primary">install it here</a>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        readOnly
                                        value={isVisible ? command : `portabase agent "${agentName}" --key ${maskedKey}`}
                                        onFocus={(e) => {
                                            setIsVisible(true);
                                            handleCopy(command, setIsCopiedCommand);
                                            e.currentTarget.select();
                                        }}
                                        onClick={(e) => e.currentTarget.select()}
                                        onBlur={() => {
                                            setIsVisible(false);
                                            setIsCopiedCommand(false);
                                        }}
                                        className="font-mono text-xs bg-muted/30 h-10 pr-10 cursor-pointer"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsVisible(!isVisible);
                                        }}
                                        className="absolute right-1 top-1.5 h-7 w-7"
                                        type="button"
                                    >
                                        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleCopy(command, setIsCopiedCommand)}
                                    className="shrink-0 gap-2 h-10 px-4"
                                    type="button"
                                >
                                    {isCopiedCommand ? (
                                        <><Check className="h-4 w-4 text-green-500" /></>
                                    ) : (
                                        <><Copy className="h-4 w-4" /></>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                  <Card className="border-muted/60 shadow-none py-0">
                        <CardHeader className="px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-tight">
                                Manual Setup
                            </CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Use this key to manually configure your agent in your configuration file.
                                If you need help for manual configuration, you can follow our guide in the <a href="https://portabase.io/docs" target="_blank" className="underline hover:text-primary">documentation</a>.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        readOnly
                                        value={isVisible ? edgeKey : maskedKey}
                                        onFocus={(e) => {
                                            setIsVisible(true);
                                            handleCopy(edgeKey, setIsCopiedKey);
                                            e.currentTarget.select();
                                        }}
                                        onClick={(e) => e.currentTarget.select()}
                                        onBlur={() => {
                                            setIsVisible(false);
                                            setIsCopiedKey(false);
                                        }}
                                        className="font-mono text-xs bg-muted/30 h-10 pr-10 cursor-pointer"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsVisible(!isVisible);
                                        }}
                                        className="absolute right-1 top-1.5 h-7 w-7 hover:bg-transparent"
                                        type="button"
                                    >
                                        {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={() => handleCopy(edgeKey, setIsCopiedKey)}
                                    className="shrink-0 gap-2 h-10 px-4 "
                                    type="button"
                                >
                                    {isCopiedKey ? (
                                        <><Check className="h-4 w-4 text-green-500" /></>
                                    ) : (
                                        <><Copy className="h-4 w-4" /></>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
        </div>
    );
};
