"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type BackButtonProps = React.ComponentProps<typeof Button> & {
    children: React.ReactNode;
};

export default function BackButton({ children, ...props }: BackButtonProps) {
    const router = useRouter();

    return (
        <Button onClick={() => router.back()} aria-label={children?.toString()} {...props}>
            {children}
        </Button>
    );
}
