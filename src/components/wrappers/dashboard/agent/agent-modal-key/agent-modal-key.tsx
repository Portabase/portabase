"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

import { generateEdgeKey } from "@/utils/edge_key";
import { PropsWithChildren } from "react";
import { CopyButton } from "@/components/wrappers/common/button/copy-button";
import { getServerUrl } from "@/utils/get-server-url";
import { CodeSnippet } from "@/components/wrappers/code-snippet/code-snippet";
import {Agent} from "@/db/schema/08_agent";

export type agentRegistrationDialogProps = PropsWithChildren<{
    agent: Agent;
}>;

export function AgentModalKey(props: agentRegistrationDialogProps) {
    const edge_key = generateEdgeKey(getServerUrl(), props.agent.id);
    const command = `portabase agent "${props.agent.name}" --key ${edge_key}`;

    return (
        <Dialog>
            <DialogTrigger asChild>{props.children}</DialogTrigger>
            <DialogContent className="sm:max-w-[425px] w-full">
                <DialogHeader>
                    <DialogTitle>Agent Connection</DialogTitle>
                </DialogHeader>
                <div className="sm:max-w-[375px] w-full space-y-4">
                    <CodeSnippet
                        title="Installation Command"
                        code={command}
                    />
                    <CodeSnippet
                        title="Agent Key (Manual)"
                        code={edge_key}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
