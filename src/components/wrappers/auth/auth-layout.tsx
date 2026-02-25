"use client";

import React, { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  const url = useSearchParams();

  useEffect(() => {
    const error = url.get("error");

    if (!error) return;

    const errorMessages: Record<string, string> = {
      pending: "Your account is not active.",
      invalid_or_expired_token: "Password reset invalid token.",
    };

    const match = Object.entries(errorMessages).find(([key]) =>
      error.includes(key),
    );

    if (!match) return;

    toast.error(match[1]);

    const params = new URLSearchParams(url.toString());
    params.delete("error");
    const newUrl =
      window.location.pathname + (params.toString() ? `?${params.toString()}` : "");

    window.history.replaceState({}, document.title, newUrl);
  }, [url]);

  return <>{children}</>;
};
