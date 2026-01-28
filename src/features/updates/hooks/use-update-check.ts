"use client";

import { useQuery } from "@tanstack/react-query";
import { getLatestRelease } from "../services/github";
import { env } from "@/env.mjs";
import { useEffect, useState } from "react";

const DISMISS_KEY = "portabase-update-dismissed";
const DISMISS_DURATION = 1000 * 60 * 60 * 24; 

export const useUpdateCheck = () => {
    const [isDismissed, setIsDismissed] = useState(true);

    const { data: latestRelease, isLoading } = useQuery({
        queryKey: ["latest-release", env.NEXT_PUBLIC_UPDATE_CHANNEL],
        queryFn: () => getLatestRelease(env.NEXT_PUBLIC_UPDATE_CHANNEL as any),
        staleTime: 1000 * 60 * 60,
    });

    const currentVersion = env.NEXT_PUBLIC_PROJECT_VERSION;

    useEffect(() => {
        if (!latestRelease) return;

        const latestVersion = latestRelease.tag_name.replace(/^v/, "");
        const cleanCurrentVersion = currentVersion?.replace(/^v/, "");

        if (latestVersion && cleanCurrentVersion && latestVersion !== cleanCurrentVersion) {
            const dismissedData = localStorage.getItem(DISMISS_KEY);
            if (dismissedData) {
                const { version, timestamp } = JSON.parse(dismissedData);
                const now = Date.now();
                if (version === latestRelease.tag_name && now - timestamp < DISMISS_DURATION) {
                    setIsDismissed(true);
                    return;
                }
            }
            setIsDismissed(false);
        } else {
            setIsDismissed(true);
        }
    }, [latestRelease, currentVersion]);

    const dismissUpdate = () => {
        if (latestRelease) {
            localStorage.setItem(DISMISS_KEY, JSON.stringify({
                version: latestRelease.tag_name,
                timestamp: Date.now()
            }));
            setIsDismissed(true);
        }
    };

    return {
        latestRelease,
        isLoading,
        isUpdateAvailable: !isDismissed && latestRelease,
        dismissUpdate
    };
};
