import { PageParams } from "@/types/next";
import { RegisterForm } from "@/components/wrappers/auth/register/register-form/register-form";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { env } from "@/env.mjs";

export const metadata: Metadata = {
    title: "Register",
};

export default async function RoutePage(props: PageParams<{}>) {
    if (env.AUTH_SIGNUP_ENABLED !== "true") {
        redirect("/login");
    }

    return (
        <div className="mx-auto grid w-full gap-6">
            <RegisterForm />
        </div>
    );
}
