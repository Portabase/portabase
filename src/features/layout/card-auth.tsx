import {cn} from "@/lib/utils";
import * as React from "react";


export function CardAuth({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="card"
            className={cn(
                "bg-transparent border-none py-3",
                "md:bg-card text-card-foreground flex flex-col gap-6 rounded-xl md:border-solid md:border md:py-6 shadow-sm",
                className
            )}
            {...props}
        />
    )
}