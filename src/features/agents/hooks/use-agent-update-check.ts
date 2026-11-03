"use client";

import {useQuery} from "@tanstack/react-query";
import {findLatestVersion, getAgentReleases} from "@/lib/github-releases";

export const useAgentReleases = () => {
    const {data: releases, isLoading} = useQuery({
        queryKey: ["agent-releases"],
        queryFn: getAgentReleases,
        staleTime: 1000 * 60 * 60,
    });

    return {releases, isLoading};
};

export const useAgentUpdateCheck = (currentVersion?: string | null) => {
    const {releases, isLoading} = useAgentReleases();
    const newRelease = currentVersion && releases ? findLatestVersion(currentVersion, releases) : null;

    return {
        newRelease,
        isLoading,
        isUpdateAvailable: !!newRelease,
    };
};
