"use client";

import { useEffect, useState } from "react";

export type DiceBearStylesState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "success"; styles: string[] };

export function useDiceBearStyles(): DiceBearStylesState {
  const [state, setState] = useState<DiceBearStylesState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.dicebear.com/10.x", {
      headers: { Accept: "application/json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error("api error");
        return r.json();
      })
      .then((data: { styles?: string[] }) => {
        if (cancelled) return;
        const styles = data?.styles;
        if (!Array.isArray(styles) || styles.length === 0) throw new Error("empty");
        setState({ status: "success", styles });
      })
      .catch(() => {
        if (!cancelled) setState({ status: "error" });
      });
    return () => { cancelled = true; };
  }, []);

  return state;
}
