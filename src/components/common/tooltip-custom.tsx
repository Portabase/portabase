import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PropsWithChildren } from "react";

export type TooltipCustomProps = PropsWithChildren<{
    text: string;
    disabled?: any;
}>;

export function TooltipCustom(props: TooltipCustomProps) {
    return (
        <>
            {props.disabled ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className="w-full">{props.children}</TooltipTrigger>
                        <TooltipContent>
                            <p>{props.text}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                props.children
            )}
        </>
    );
}
