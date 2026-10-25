import * as React from "react";
import EmailLayout from "./email-layout";
import {Text, Section} from "react-email";
import type {EventPayload} from "@/features/notifications/types";

export interface EmailNotificationProps {
    payload: EventPayload;
}

export const EmailNotification = ({payload}: EmailNotificationProps) => {
    return (
        <EmailLayout preview={payload.message}>
            <Section>
                <Text className="text-xl font-bold ">
                    {payload.title}
                </Text>
                <Text className=" font-semibold ">
                    Level: {payload.level}
                </Text>
            </Section>

            {payload.message && (
                <Section className="mb-2">
                    <Text
                        className="text-base  font-light"
                        dangerouslySetInnerHTML={{__html: payload.message.replace(/\n/g, "<br>")}}
                    />
                </Section>
            )}

            {payload.data && (
                <Section className="mb-6 p-4 bg-gray-100 rounded text-sm text-gray-700">
                    <Text>
                        <pre>{JSON.stringify(payload.data, null, 2)}</pre>
                    </Text>
                </Section>
            )}

            <Section className="mt-8">
                <Text className="text-base font-light ">
                    Regards,
                    <br/>
                    Portabase
                </Text>
            </Section>
        </EmailLayout>
    );
};

export default EmailNotification;
