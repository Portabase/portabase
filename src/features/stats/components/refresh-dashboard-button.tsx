"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { refreshDashboardAction } from "@/features/stats/actions/refresh-dashboard.action";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

export function RefreshDashboardButton() {
  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: () => refreshDashboardAction(),
    onSuccess: () => router.refresh(),
  });

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => mutate()}
      disabled={isPending}
    >
      <RefreshCw className={cn("h-4 w-4 mr-2", isPending && "animate-spin")} />
      {isPending ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
