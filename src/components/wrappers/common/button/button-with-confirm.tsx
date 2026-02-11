"use client"
import {Button, ButtonVariantsProps} from "@/components/ui/button";
import {ReactNode, useState} from "react";
import {Loader2} from "lucide-react";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {cn} from "@/lib/utils";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

export type ButtonWithConfirmProps = {
    title: string;
    description: string;
    button?: {
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
    children?: ReactNode;
    onConfirm?: (e: React.MouseEvent) => void;
    onCancel?: (e: React.MouseEvent) => void;
    confirmButtonText?: string;
    cancelButtonText?: string;
    isPending?: boolean;
};


export const ButtonWithConfirm = (props: ButtonWithConfirmProps) => {
    const [isConfirming, setIsConfirming] = useState(false);

    const isLegacy = !!props.button;
    const isDisabled = isLegacy ? !!props.button?.main.disabled : false;

    const handleConfirm = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLegacy) {
            props.button?.confirm.onClick?.();
        } else {
            props.onConfirm?.(e);
        }
        setIsConfirming(false);
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isLegacy) {
            props.button?.cancel.onClick?.();
        } else {
            props.onCancel?.(e);
        }
        setIsConfirming(false);
    };

    const triggerContent = isLegacy ? (
        <Button
            type={props.button?.main.type}
            disabled={isDisabled}
            variant={props.button?.main.variant ?? "default"}
            size={props.button?.main.size ?? "default"}
            className={props.button?.main.className}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isDisabled) setIsConfirming(true);
            }}
        >
            {props.isPending && <Loader2 className="animate-spin mr-4" size={16}/>}
            {props.button?.main.icon}
            {props.button?.main.text && <span>{props.button.main.text}</span>}
        </Button>
    ) : (
        <div onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsConfirming(true);
        }}>
            {props.children}
        </div>
    );

    const withTooltip = isLegacy && props.button?.main.tooltipText && isDisabled ? (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div>{triggerContent}</div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{props.button?.main.tooltipText}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    ) : triggerContent;

    return (
        <Popover open={isConfirming} onOpenChange={setIsConfirming}>
            <PopoverTrigger asChild>
                {withTooltip}
            </PopoverTrigger>
            <PopoverContent 
                className="w-80" 
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                onClick={(e) => e.stopPropagation()}
                onMouseMove={(e) => e.stopPropagation()}
                onMouseEnter={(e) => e.stopPropagation()}
                onMouseLeave={(e) => e.stopPropagation()}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">{props.title}</h4>
                        <p className="text-sm text-muted-foreground">{props.description}</p>
                    </div>
                    <div className="grid gap-2">
                        <Button
                            onClick={handleConfirm}
                            variant={isLegacy ? (props.button?.confirm.variant ?? "default") : "default"}
                            size={isLegacy ? (props.button?.main.size ?? "default") : "default"}
                            className={cn(isLegacy ? props.button?.main.className : "", "w-full")}
                        >
                            {props.isPending && <Loader2 className="animate-spin mr-4" size={16}/>}
                            {isLegacy && props.button?.confirm.icon}
                            <span>{isLegacy ? props.button?.confirm.text : (props.confirmButtonText ?? "Confirm")}</span>
                        </Button>
                        <Button
                            variant={isLegacy ? (props.button?.cancel.variant ?? "outline") : "outline"}
                            onClick={handleCancel}
                            className={cn(isLegacy ? props.button?.main.className : "", "w-full")}
                            size={isLegacy ? (props.button?.main.size ?? "default") : "default"}
                        >
                            {isLegacy ? (props.button?.cancel.text ?? "Cancel") : (props.cancelButtonText ?? "Cancel")}
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};