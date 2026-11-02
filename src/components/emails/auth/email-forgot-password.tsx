import * as React from "react";
import EmailLayout from "../email-layout";
import {Heading, Text, Section, Button} from "react-email";
import {getServerUrl} from "@/utils/get-server-url";

interface EmailCreateUserProps {
    firstname?: string;
    token: string;
}

export const EmailForgotPassword = ({firstname, token}: EmailCreateUserProps) => {
    const baseUrl = getServerUrl();

    return (
        <EmailLayout preview="Portabase - Forgot Password">
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
                Hello <strong>{firstname}</strong>,
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">
                We received a request to reset the password for your account associated with this email.
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
                If you did not request this password reset, please ignore this email. Your current password
                will remain unchanged. If this seems suspicious, please contact your administrator.
            </Text>
            <Section className="mt-[32px] mb-[32px] text-center">
                <Button
                    className="rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                    href={`${baseUrl}/reset-password?token=${token}`}
                >
                    Reset my password
                </Button>
            </Section>
        </EmailLayout>
    );
};

export default EmailForgotPassword;
