"use client";

import {useQuery} from "@tanstack/react-query";
import {getNewAgentRelease} from "@/lib/github-releases";

export const useAgentUpdateCheck = (currentVersion?: string | null) => {
    const {data: newRelease, isLoading} = useQuery({
        queryKey: ["agent-new-release", currentVersion],
        queryFn: () => currentVersion ? getNewAgentRelease(currentVersion) : Promise.resolve(null),
        staleTime: 1000 * 60 * 60,
        enabled: !!currentVersion,
    });

    return {
        newRelease,
        isLoading,
        isUpdateAvailable: !!newRelease,
    };
};
