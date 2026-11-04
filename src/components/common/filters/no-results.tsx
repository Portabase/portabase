import {SearchX} from "lucide-react";
import {cn} from "@/lib/utils";

export const NoResults = ({className}: { className?: string }) => (
    <div className={cn("flex w-full flex-col items-center justify-center gap-4 py-12 text-center", className)}>
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <SearchX className="size-6 text-muted-foreground"/>
        </div>
        <div className="space-y-1">
            <p className="text-base font-semibold">No results found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
        </div>
    </div>
);
