"use client"
import {EmailForm} from "@/features/settings/components/email-form";
import {Setting} from "@/db/schema/01_setting";
import {EmailFormType} from "@/features/settings/schemas/email-form.schema";


export type SettingsEmailSectionProps = {
    settings: Setting;
};

export const SettingsEmailSection = (props: SettingsEmailSectionProps) => {

    return (
        <div
            className="flex flex-col h-full ">
                <EmailForm defaultValues={props.settings.smtpFrom ? props.settings as EmailFormType : undefined}/>
        </div>
    );
};
