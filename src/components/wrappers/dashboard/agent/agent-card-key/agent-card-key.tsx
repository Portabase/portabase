"use client";

import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Copy, Check, Eye, EyeOff, Terminal, Key, Info} from "lucide-react";
import {useState} from "react";
import {copyToClipboardWithMeta} from "@/components/wrappers/common/button/copy-button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
            <Tabs defaultValue="automatic" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="automatic" className="gap-2">
                        <Terminal className="h-4 w-4" />
                        <span>Automatic</span>
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2">
                        <Key className="h-4 w-4" />
                        <span>Manual</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="automatic" className="mt-4 focus-visible:outline-none">
                    <Card className="border-muted/60 shadow-none py-0">
                        <CardHeader className="pb-3 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-tight">
                                CLI Setup
                            </CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Click the input below to reveal the key and copy it to your terminal.
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
                            <div className="p-3 rounded-md bg-orange-500/10 dark:bg-orange-500/5 border border-orange-500/20">
                                <div className="flex gap-2.5">
                                    <Terminal className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-orange-900 dark:text-orange-100">CLI Installation</p>
                                        <p className="text-[11px] text-orange-800/80 dark:text-orange-400/80 leading-normal">
                                            This command requires the <strong>portabase cli</strong>. If you haven't installed it yet, you can find the instructions at{" "}
                                            <a
                                                href="https://portabase.io/docs/cli"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-bold underline underline-offset-2 hover:text-orange-700 dark:hover:text-orange-300 transition-colors"
                                            >
                                                portabase.io/docs/cli
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manual" className="mt-4 focus-visible:outline-none">
                    <Card className="border-muted/60 shadow-none py-0">
                        <CardHeader className="pb-3 px-4 pt-4">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2 uppercase tracking-tight">
                                Registration Key
                            </CardTitle>
                            <CardDescription className="text-xs leading-relaxed">
                                Use this key to manually configure your agent in your configuration file.
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

                            <div className="flex flex-col gap-3">
                                <div className="p-3 rounded-md bg-orange-500/10 dark:bg-orange-500/5 border border-orange-500/20">
                                    <div className="flex gap-2.5">
                                        <Info className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-orange-900 dark:text-orange-100">Important Security Note</p>
                                            <p className="text-[11px] text-orange-800/80 dark:text-orange-400/80 leading-normal">
                                                Never share this key. Anyone with access to it can register as this agent.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 rounded-md bg-muted/30 border border-muted/50">
                                    <div className="flex gap-2.5">
                                        <Terminal className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-xs font-bold text-foreground">Need help with manual setup?</p>
                                            <p className="text-[11px] text-muted-foreground leading-normal">
                                                Check out our guide for manual configuration and Docker deployment at{" "}
                                                <a
                                                    href="https://portabase.io/docs/agent/setup#docker"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-bold underline underline-offset-2 hover:text-orange-500 transition-colors text-foreground"
                                                >
                                                    portabase.io/docs/setup
                                                </a>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
