"use client"

import {useRouter, useSearchParams} from "next/navigation";
import {ResetPasswordForm} from "@/features/auth/reset-password-page-form";
import {toast} from "sonner";
import {useEffect} from "react";
import {LoadingSpinner} from "@/components/common/loading-spinner";

export const ResetPasswordSection = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get("token");
    const error = searchParams.get("error");

    useEffect(() => {
        if (error || !token) {
            if (error == "INVALID_TOKEN") {
                toast.error("Invalid reset token");
            } else {
                toast.error("An error occurred.");
            }
            setTimeout(() => router.push("/"), 1000);
        }
    }, [error, token, router]);


    if (!token) return (
        <div className="w-full h-full flex flex-col items-center justify-center">
            <LoadingSpinner size={50}/>
        </div>
    );

    return (
        <ResetPasswordForm token={token}/>
    )
}