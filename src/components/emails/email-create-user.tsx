import * as React from "react";
import EmailLayout from "./email-layout";
import {Heading, Text, Section, Button} from "@react-email/components";
import {getServerUrl} from "@/utils/get-server-url";
import {env} from "@/env.mjs";

interface EmailCreateUserProps {
    email: string;
    password?: string;
}

export const EmailCreateUser = ({email, password}: EmailCreateUserProps) => {
    const baseUrl = getServerUrl();


    return (
        <EmailLayout preview="Portabase Dashboard">
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
                Your account on {env.PROJECT_NAME} has just been created!
            </Heading>

            <Text className="text-[14px] text-black leading-[24px]">
                <strong>Email: </strong>{email}
            </Text>

            {password ? (
                <Text className="text-[14px] text-black leading-[24px]">
                    <strong>Default password: </strong>{password}
                </Text>
            ) : (
                <Text className="text-[14px] text-black leading-[24px]">
                    You can log in using one of the single sign-on (SSO) providers configured by your administrator.
                </Text>
            )}

            <Section className="mt-[32px] mb-[32px] text-center">
                <Button
                    className="rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                    href={baseUrl}
                >
                    Sign in
                </Button>
            </Section>
        </EmailLayout>
    );
};

export default EmailCreateUser;
