import { Body, Container, Head, Html, Img, Preview, Section, Tailwind } from "react-email";
import * as React from "react";
import { PropsWithChildren } from "react";
import { getServerUrl } from "@/utils/get-server-url";

const baseUrl = getServerUrl();

export const EmailLayout = ({ children, preview }: PropsWithChildren<{ preview?: string }>) => {
    return (
        <Tailwind>
            <Html>
                <Head />
                <Body className="mx-auto my-auto bg-white px-2 font-sans">
                    {preview ? <Preview>{preview}</Preview> : <Preview>Please check your mails</Preview>}
                    <Container className="mx-auto my-[40px] max-w-[465px] rounded border border-[#eaeaea] border-solid p-[20px]">
                        <Section className="mt-[32px]">
                            <Img
                                src={`${baseUrl}/images/logo.png`}
                                width="50"
                                height="auto"
                                alt="Logo"
                                className="mx-auto my-0"
                            />
                        </Section>
                        {children}
                    </Container>
                </Body>
            </Html>
        </Tailwind>
    );
};

export default EmailLayout;
