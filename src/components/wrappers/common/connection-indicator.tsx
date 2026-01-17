import { cn } from "@/lib/utils";

export type ConnectionIndicatorProps = {
    date?: Date | null;
};

export const ConnectionIndicator = ({ date }: ConnectionIndicatorProps) => {
    let style = "bg-gray-300";
    let active = false;

    if (date instanceof Date && !isNaN(date.getTime())) {
        const intervalSeconds = (Date.now() - date.getTime()) / 1000;

        if (intervalSeconds < 55) {
            style = "bg-green-500";
            active = true;
        } else if (intervalSeconds <= 60) {
            style = "bg-orange-400";
        } else {
            style = "bg-red-500";
        }
    }

    return (
        <div className="relative w-4 h-4">
            {active && (
                <span
                    className={cn(
                        "absolute -inset-0.25 rounded-full opacity-60 animate-ping",
                        style
                    )}
                    style={{
                        animationDuration: "2s",
                    }}
                />
            )}
            <div
                className={cn(
                    "relative w-4 h-4 rounded-full shadow-sm animate-pulse",
                    style
                )}
                style={{
                    animationDuration: "2s",
                }}
            />
        </div>
    );
};
