import {cn} from "@/lib/utils";
import {
    getAgentStatus,
    LIVE_THRESHOLDS,
    msSinceLastContact,
} from "@/features/agents/utils/status/agent-status";

export type ConnectionIndicatorProps = {
    date?: Date | null;
};

const STATUS_STYLE = {
    online: "bg-green-500",
    degraded: "bg-orange-400",
    offline: "bg-red-500",
} as const;

export const ConnectionIndicator = ({date}: ConnectionIndicatorProps) => {
    const hasContact = msSinceLastContact(date) !== null;
    const style = hasContact
        ? STATUS_STYLE[getAgentStatus(date, LIVE_THRESHOLDS)]
        : "bg-gray-300";

    return (
        <div className="relative w-3 h-3">

                <span
                    className={cn(
                        "absolute -inset-0.25 rounded-full opacity-60 animate-ping",
                        style
                    )}
                    style={{
                        animationDuration: "2s",
                    }}
                />

            <div
                className={cn(
                    "relative w-3 h-3 rounded-full shadow-sm animate-pulse",
                    style
                )}
                style={{
                    animationDuration: "2s",
                }}
            />
        </div>
    );
};
