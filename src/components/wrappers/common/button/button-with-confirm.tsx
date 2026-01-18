"use client"
import {Button, ButtonVariantsProps} from "@/components/ui/button";
import {useState} from "react";
import {Loader2} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";

export type ButtonWithConfirmProps = {
    title: string;
    description: string;
    button: {
        main: {
            className?: string;
            type?: "button" | "submit" | "reset" | undefined;
            text?: string;
            icon?: any;
            variant?: ButtonVariantsProps["variant"];
            size?: ButtonVariantsProps["size"];
            disabled?: boolean;
            tooltipText?: string;
        };
        confirm: {
            className?: string;
            text: string;
            icon?: any;
            variant?: ButtonVariantsProps["variant"];
            size?: ButtonVariantsProps["size"];
            onClick?: () => void;
        };
        cancel: {
            className?: string;
            text: string;
            icon?: any;
            variant?: ButtonVariantsProps["variant"];
            size?: ButtonVariantsProps["size"];
            onClick?: () => void;
        };
    };
    isPending?: boolean;
};


export const ButtonWithConfirm = (props: ButtonWithConfirmProps) => {
    const [isConfirming, setIsConfirming] = useState(false);

    return (
        <Popover open={isConfirming} onOpenChange={!props.button.main.disabled ? setIsConfirming : undefined}>
            <Tooltip>
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <span
                            className={cn(
                                "inline-flex",
                                props.button.main.disabled ? "cursor-not-allowed" : ""
                            )}
                            role="button">
                          <Button
                              type={props.button.main.type}
                              disabled={!!props.button.main.disabled}
                              variant={props.button.main.variant ?? "default"}
                              size={props.button.main.size ?? "default"}
                              className={props.button.main.className}
                              onClick={() => {
                                  if (!props.button.main.disabled) setIsConfirming(true);
                              }}
                          >
                              {props.isPending && <Loader2 className="animate-spin mr-4" size={16}/>}
                              {props.button.main.icon}
                              {props.button.main.text && <span>{props.button.main.text}</span>}
                          </Button>
                        </span>
                    </PopoverTrigger>
                </TooltipTrigger>
                {props.button.main.tooltipText && props.button.main.disabled && (
                    <TooltipContent>
                        <p>{props.button.main.tooltipText}</p>
                    </TooltipContent>
                )}
            </Tooltip>
            <PopoverContent className="w-80">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">{props.title}</h4>
                        <p className="text-sm text-muted-foreground">{props.description}</p>
                    </div>
                    <div className="grid gap-2">
                        <Button
                            onClick={() => {
                                if (isConfirming && props.button.confirm.onClick) {
                                    props.button.confirm.onClick();
                                    setIsConfirming(false);
                                } else {
                                    setIsConfirming(true);
                                }
                            }}
                            variant={props.button.confirm.variant ? props.button.confirm.variant : "default"}
                            size={props.button.main.size ?? "default"}
                            className={cn(props.button.main.className, "w-full")}
                        >
                            {props.isPending && <Loader2 className="animate-spin mr-4" size={16}/>}
                            {props.button.confirm.icon ? props.button.confirm.icon : null}
                            <span>{props.button.confirm.text}</span>
                        </Button>
                        <Button
                            variant={props.button.cancel.variant ? props.button.cancel.variant : "default"}
                            onClick={props.button.cancel.onClick ? () => props.button.cancel.onClick!() : () => setIsConfirming(false)}
                            className={cn(props.button.main.className, "w-full")}
                            size={props.button.main.size ?? "default"}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};

