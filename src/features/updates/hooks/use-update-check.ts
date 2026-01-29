"use client";

import {useQuery} from "@tanstack/react-query";
import {getNewRelease} from "../services/github";
import {env} from "@/env.mjs";
import {useEffect, useState} from "react";

const DISMISS_KEY = "portabase-update-dismissed";
const DISMISS_DURATION = 1000 * 60 * 60 * 24;

export const useUpdateCheck = () => {
        const [isDismissed, setIsDismissed] = useState(true);

        const currentVersion = env.NEXT_PUBLIC_PROJECT_VERSION!;

        const {data: newRelease, isLoading} = useQuery({
            queryKey: ["new-release"],
            queryFn: () => getNewRelease(currentVersion),
            staleTime: 1000 * 60 * 60,
        });

        console.log("newRelease", newRelease);


        useEffect(() => {
            if (!newRelease) return;

            const dismissedData = localStorage.getItem(DISMISS_KEY);
            if (dismissedData) {
                const {version, timestamp} = JSON.parse(dismissedData);
                const now = Date.now();
                if (version === newRelease.name && now - timestamp < DISMISS_DURATION) {
                    setIsDismissed(true);
                    return;
                }
            }
            setIsDismissed(false);

        }, [newRelease])


        const dismissUpdate = () => {
            if (newRelease) {
                localStorage.setItem(DISMISS_KEY, JSON.stringify({
                    version: newRelease.name,
                    timestamp: Date.now()
                }));
                setIsDismissed(true);
            }
        };

        return {
            newRelease,
            isLoading,
            isUpdateAvailable: !isDismissed && newRelease,
            dismissUpdate
        };
    }
;
