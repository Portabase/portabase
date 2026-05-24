"use server";
import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import type { EventPayload, DispatchResult } from '@/features/notifications/notifications.types';
import EmailNotification from "@/components/emails/email-notification";

export async function sendSmtp(
    config: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password: string;
        from: string;
        to: string | string[];
    },
    payload: EventPayload
): Promise<DispatchResult> {

    const transporter = nodemailer.createTransport({
        pool: true,
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.password },
    });

    await transporter.verify();


    const info = await transporter.sendMail({
        from: config.from,
        to: Array.isArray(config.to) ? config.to.join(", ") : config.to,
        subject: `[${payload.level.toUpperCase()}] ${payload.title}`,
        html: await render(EmailNotification({
            payload: payload
        })),
    });

    return {
        success: true,
        provider: "smtp",
        message: `Email sent: ${config.to}`,
        response: info,
    };
}
