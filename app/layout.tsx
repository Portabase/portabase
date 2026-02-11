import React from "react";
import type {Metadata} from "next";
import "./globals.css";
import {Providers} from "./providers";
import {cn} from "@/lib/utils";
import {ConsoleSilencer} from "@/components/wrappers/common/console-silencer";
import {author, geistMono, poppins} from "@/fonts/fonts";

const title = process.env.PROJECT_NAME ?? "App Title";

export const metadata: Metadata = {
    title: {
        default: title,
        template: `%s - ${title}`
    },
    description: process.env.PROJECT_DESCRIPTION ?? undefined,
};

export default async function RootLayout({
                                             children,
                                         }: Readonly<{
    children: React.ReactNode;
}>) {

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <meta name="apple-mobile-web-app-title" content={title}/>
        </head>
        <body className={cn(poppins.variable, author.variable, geistMono.variable, "font-sans h-full")}>
        <ConsoleSilencer/>
        <Providers>
            {children}
        </Providers>
        </body>
        </html>
    );
}
