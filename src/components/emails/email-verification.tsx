import {Heading, Text, Section, Button} from "@react-email/components";
import {getServerUrl} from "@/utils/get-server-url";
import EmailLayout from "@/components/emails/email-layout";

interface EmailCreateUserProps {
    firstname?: string;
    oldEmail?: string;
    newEmail?: string;
    url: string;
}

export const EmailVerification = ({firstname, oldEmail, newEmail, url: urlVerification}: EmailCreateUserProps) => {
    const serverUrl = new URL(getServerUrl());
    const url = new URL(urlVerification);
    url.hostname = serverUrl.hostname;
    url.port = serverUrl.port == "80" ? "" : serverUrl.port;
    const newUrl = url.toString();

    return (
        <EmailLayout preview="Portabase email verification">
            <Heading className="mx-0 my-[30px] p-0 text-center font-normal text-[24px] text-black">
                Hello <strong>{firstname}</strong>,
            </Heading>
            <Text className="text-[14px] text-black leading-[24px]">
                We received a request to change the email address associated with your account.
            </Text>
            <Text className="text-[14px] text-black leading-[24px]">
                If you did not request this change, please ignore this email. Your current email address will remain
                unchanged. If this seems suspicious, contact your administrator.
            </Text>

            {oldEmail && newEmail ? (
                <Text className="text-[14px] text-black leading-[24px]">
                    <strong>Old email address:</strong> {oldEmail}
                    <br/>
                    <strong>New email address:</strong> {newEmail}
                </Text>
            ) : null}

            <Section className="mt-[32px] mb-[32px] text-center">
                <Button
                    className="rounded bg-[#000000] px-5 py-3 text-center font-semibold text-[12px] text-white no-underline"
                    href={newUrl}>
                    Confirm email address
                </Button>
            </Section>
        </EmailLayout>
    );
};

export default EmailVerification;
