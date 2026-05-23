"use client"

import { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export type VariantButton = {
    secondary: string;
    default: string;
    outline: string;
    ghost: string;
    link: string;
    destructive: string;
};

export type SizeButton = {
    default: string;
    icon: string;
    sm: string;
    lg: string;
};

export type ButtonWithLoadingProps = {
    children?: string | ReactNode;
    icon?: ReactNode;
    variant?: keyof VariantButton;
    className?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    isPending?: boolean;
    size?: keyof SizeButton;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export const ButtonWithLoading = ({
                                      icon,
                                      children,
                                      variant = "default",
                                      className,
                                      onClick,
                                      isPending,
                                      size = "default",
                                      ...rest
                                  }: ButtonWithLoadingProps) => {
    return (
        <Button
            onClick={(e) => onClick?.(e)}
            variant={variant}
            className={className}
            size={size}
            {...rest}
        >
            {isPending && <Loader2 className="mr-2 animate-spin" size={16} />}
            {children && children}
            <>{icon ? icon : null}</>
        </Button>
    );
};
