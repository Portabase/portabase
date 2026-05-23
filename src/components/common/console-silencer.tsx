"use client";

import { useEffect } from "react";

export function ConsoleSilencer() {
    useEffect(() => {
        if (process.env.NODE_ENV === "production") {
            for (const method of ["log", "debug", "info", "warn", "error"] as const) {
                console[method] = () => {};
            }
        }
    }, []);

    return null;
}