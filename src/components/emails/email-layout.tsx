import { Body, Container, Head, Html, Img, Preview, Section, Tailwind } from "@react-email/components";
import * as React from "react";
import { PropsWithChildren } from "react";
import { getServerUrl } from "@/utils/get-server-url";

const baseUrl = getServerUrl();

export const EmailLayout = ({ children, preview }: PropsWithChildren<{ preview?: string }>) => {
    return (
        <Tailwind>
            <Html>
                <Head />
                {preview ? <Preview>{preview}</Preview> : <Preview>Please check your mails</Preview>}
                <Body className="bg-gray-100 py-4" style={{ fontFamily: "Arial, sans-serif" }}>
                    <Container className="bg-white border border-gray-200 p-12">
                        <Img src={`${baseUrl}/images/logo-dark.png`} width="200" height="auto" alt="Logo" />
                        <Section>{children}</Section>
                    </Container>
                </Body>
            </Html>
        </Tailwind>
    );
};

export default EmailLayout;
