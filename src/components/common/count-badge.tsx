import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeVariant = React.ComponentProps<typeof Badge>["variant"];

interface CountBadgeProps {
    count: number;
    variant?: BadgeVariant;
    className?: string;
}

/**
 * Small count indicator pinned to the top-right corner of a `relative` parent
 * (typically an icon button). Renders nothing when `count` is 0 or less.
 */
export function CountBadge({ count, variant, className }: CountBadgeProps) {
    if (count <= 0) return null;

    return (
        <Badge
            variant={variant}
            className={cn(
                "absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center",
                className,
            )}
        >
            {count}
        </Badge>
    );
}
