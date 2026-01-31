"use server"
import {db} from "@/db";
import {eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {createTransporter} from "@/lib/email/helpers";
import {Payload} from "@/lib/email/types";

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

    const transporter = createTransporter({
        host: settings.smtpHost,
        port: Number(settings.smtpPort),
        user: settings.smtpUser,
        pass: settings.smtpPassword,
        from: settings.smtpFrom,
        secure: settings.smtpSecure ?? false,
    });
    await transporter.verify();

    return await transporter.sendMail({
        ...data,
        to: emailsArray,
        from: settings.smtpFrom ?? undefined,
    });
};
