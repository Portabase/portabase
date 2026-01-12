"use client";

import {Card} from "@/components/ui/card";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {Badge} from "@/components/ui/badge";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {truncateWords} from "@/utils/text";
import {useIsMobile} from "@/hooks/use-mobile";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {
    EditChannelButton
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-card/button-edit-channel";
import {ChannelKind, getChannelIcon} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {
    DeleteChannelButton
} from "@/components/wrappers/dashboard/admin/channels/channel/channel-card/button-delete-channel";

export type ChannelCardProps = {
    data: NotificationChannelWith | StorageChannelWith;
    organization?: OrganizationWithMembers;
    organizations?: OrganizationWithMembers[];
    adminView?: boolean;
    kind?: ChannelKind;
};


export const ChannelCard = (props: ChannelCardProps) => {
    const {data, organization, kind} = props;
    const isMobile = useIsMobile()

    return (
        <div className="block transition-all duration-200 rounded-xl">
            <Card className="flex flex-row justify-between p-4">
                <div className="flex items-center gap-3">
                    <div
                        className="flex h-10 w-10 items-center justify-center rounded-md bg-secondary border border-border">
                        {getChannelIcon(data.provider)}
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
                {kind && (
                    <div className="flex items-center gap-2">
                        <EditChannelButton
                            organizations={props.organizations}
                            adminView={props.adminView}
                            organization={organization}
                            channel={data}
                            kind={kind}
                        />
                        <DeleteChannelButton
                            kind={kind}
                            organizationId={organization?.id}
                            channelId={data.id}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
};


