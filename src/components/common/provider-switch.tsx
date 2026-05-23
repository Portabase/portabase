import {Icon} from "@iconify/react";
import {CircleHelp, KeyRound} from "lucide-react";
import {cn} from "@/lib/utils";


export const providerSwitch = (provider: string, small?: boolean) => {
    switch (provider) {
        case "google":
            return (
                <div className={cn(small ? "p-0" : "p-4")}>
                    {small ?
                        <Icon icon={"flat-color-icons:google"} height="24"/>
                        :
                        <Icon icon={"logos:google"} height="24"/>
                    }
                </div>
            );
        case "credential":
            return (
                <div className={cn("flex flex-row gap-x-2 items-center", small ? "p-0" : "p-4")}>
                    <KeyRound height="24"/>
                    {!small && (<span>Email and Password</span>)}
                </div>
            );
        default:
            return (
                <div className={cn("flex flex-row gap-x-2 items-center", small ? "p-0" : "p-4")}>
                    <CircleHelp height="24"/>
                    {!small && (<span>No credentials</span>)}
                </div>
            );
    }
}



