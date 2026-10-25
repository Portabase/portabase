import * as React from "react";
import EmailLayout from "../email-layout";
import {Heading, Text} from "react-email";

interface EmailCreateUserProps {
    firstname?: string;
    os: string;
    browser: string;
    ipAddress?: string;
}

export const EmailNewLogin = ({firstname, ipAddress, os, browser}: EmailCreateUserProps) => {
    return (
        <EmailLayout preview="Portabase - New Login">
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
                Hello <strong>{firstname}</strong>,
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">
                We detected a new login to your account.
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
                <strong>Login details:</strong>
                <br/>
                Device: {os} - {browser}
                <br/>
                IP Address: {ipAddress}
            </Text>
        </EmailLayout>
    );
};

export default EmailNewLogin;
