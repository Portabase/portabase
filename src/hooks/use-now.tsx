"use client";

import {createContext, ReactNode, useContext, useSyncExternalStore} from "react";

const ServerNowContext = createContext<number | null>(null);

const subscribe = () => () => {};

export const ServerNowProvider = ({serverNow, children}: { serverNow: number, children: ReactNode }) => (
    <ServerNowContext.Provider value={serverNow}>{children}</ServerNowContext.Provider>
);

export function useNow() {
    const serverNow = useContext(ServerNowContext);
    const isHydrated = useSyncExternalStore(subscribe, () => true, () => false);
    return isHydrated || serverNow === null ? Date.now() : serverNow;
}
