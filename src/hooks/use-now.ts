"use client";

import {useSyncExternalStore} from "react";

const subscribe = () => () => {};

export function useNow(serverNow: number) {
    const isHydrated = useSyncExternalStore(subscribe, () => true, () => false);
    return isHydrated ? Date.now() : serverNow;
}
