"use client";

import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import TwoFactorForm from "@/components/wrappers/dashboard/profile/form/2fa-form";

export const GuardForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("redirect") || "/dashboard";

    return (
        <TwoFactorForm
            onSuccess={(success) => {
                if (success) {
                    toast.success("Successfully logged in!");
                    //@ts-ignore
                    router.push(callbackUrl);
                    router.refresh();
                }
            }}
        />
    );
};
