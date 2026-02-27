"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/auth/auth-client";

export default function ErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }

    const error = searchParams.get("error");
    const params = new URLSearchParams();
    if (error) {
      params.set("error", error);
    }

    const destination = session ? "/dashboard/home" : "/login";
    router.replace(`${destination}?${params.toString()}`);
  }, [isPending, session, router, searchParams]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
