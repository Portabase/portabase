"use server";

import {db} from "@/db";
import {eq} from "drizzle-orm";
import nodemailer from "nodemailer";
import * as drizzleDb from "@/db";

type Payload = {
    to: string;
    from?: string;
    subject: string;
    html: any;
};

type Server = {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
};

type EmailCustomProps = {
    data: Payload;
    server: Server;
};

type EmailMassProps = {
    data: Payload;
    servers: Server[];
};

export const sendEmail = async (data: Payload) => {
    const settings = await db
        .select()
        .from(drizzleDb.schemas.setting)
        .where(eq(drizzleDb.schemas.setting.name, "system"))
        .then((res) => res[0]);

    if (!settings) {
        throw new Error("SMTP system settings not found.");
    }

    if (!settings.smtpHost || !settings.smtpPort || !settings.smtpUser || !settings.smtpPassword || !settings.smtpFrom) {
        console.warn("Incomplete SMTP settings. Email not sent.");
        return;
    }

    const emailsArray = data.to.split(",")
        .map(email => email.trim());


    const transporter = nodemailer.createTransport({
        pool: true,
        host: settings.smtpHost ?? "",
        port: parseInt(settings.smtpPort ?? "587"),
        secure: true,
        auth: {
            user: settings.smtpUser ?? "",
            pass: settings.smtpPassword ?? "",
        },
    });

    return await transporter.sendMail({
        ...data,
        to: emailsArray,
        from: settings.smtpFrom ?? undefined,
    });
};

export const sendCustomEmail = async (data: EmailCustomProps) => {
    const transporter = nodemailer.createTransport({
        secure: true,
        replyTo: data.server.user,
        host: data.server.host,
        port: data.server.port,
        auth: {
            user: data.server.user,
            pass: data.server.pass,
        },
    });

    return await transporter.sendMail({
        ...data.data,
    });
};

export const sendMassEmail = async (data: EmailMassProps) => {
    for (const server of data.servers) {
        const transporter = nodemailer.createTransport({
            secure: true,
            host: server.host,
            port: server.port,
            auth: {
                user: server.user,
                pass: server.pass,
            },
        });

        return await transporter.sendMail({
            ...data.data,
        });
    }
};
