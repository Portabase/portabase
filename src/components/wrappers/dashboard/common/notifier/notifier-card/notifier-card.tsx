"use client";

import {Card} from "@/components/ui/card";
import {NotificationChannel, NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {Badge} from "@/components/ui/badge";
import {
    DeleteNotifierButton
} from "@/components/wrappers/dashboard/common/notifier/notifier-card/button-delete-notifier";
import {EditNotifierButton} from "@/components/wrappers/dashboard/common/notifier/notifier-card/button-edit-notifier";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {getNotificationChannelIcon} from "@/components/wrappers/dashboard/admin/notifications/helpers";
import {truncateWords} from "@/utils/text";
import {useIsMobile} from "@/hooks/use-mobile";

export type NotifierCardProps = {
    data: NotificationChannelWith;
    organization?: OrganizationWithMembers;
    organizations?: OrganizationWithMembers[];
    adminView?: boolean;
};

export const NotifierCard = (props: NotifierCardProps) => {
    const {data, organization} = props;
    const isMobile = useIsMobile()

    return (
        <div className="block transition-all duration-200 rounded-xl">
            <Card className="flex flex-row justify-between p-4">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary border border-border">
                        {getNotificationChannelIcon(data.provider)}
                    </div>
                    <div className={`h-2 w-2 rounded-full ${data.enabled ? "bg-green-600" : "bg-muted"}`}/>
                </div>

                <div className="flex justify-start w-full">
                    <div className="flex flex-col items-start md:flex-row md:items-center gap-2 ">
                        <h3 className="font-medium text-foreground">{isMobile ? truncateWords(data.name, 2) : data.name}</h3>
                        <Badge variant="secondary" className="text-xs font-mono">
                            {data.provider}
                        </Badge>
                    </div>
                </div>


                <div className="flex items-center gap-2">
                    <EditNotifierButton
                        organizations={props.organizations}
                        adminView={props.adminView}
                        organization={organization}
                        notificationChannel={data}/>
                    <DeleteNotifierButton
                        organizationId={organization?.id}
                        notificationChannelId={data.id}
                    />
                </div>
            </Card>
        </div>
    );
};


