"use client"
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {useState} from "react";
import {EmptyStatePlaceholder} from "@/components/wrappers/common/empty-state-placeholder";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {ChannelCard} from "@/components/wrappers/dashboard/admin/channels/channel/channel-card/channel-card";
import {ChannelAddEditModal} from "@/components/wrappers/dashboard/admin/channels/channel/channel-add-edit-modal";
import {ChannelKind, getChannelTextBasedOnKind} from "@/components/wrappers/dashboard/admin/channels/helpers/common";

type ChannelsSectionProps = {
    channels: NotificationChannelWith[] | StorageChannelWith[]
    organizations: OrganizationWithMembers[]
    kind: ChannelKind;
}

export const ChannelsSection = ({
                                    organizations,
                                    channels,
                                    kind
                                }: ChannelsSectionProps) => {

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const channelText = getChannelTextBasedOnKind(kind)
    const hasChannels = channels.length > 0


    return (
        <div className="h-full">
            <ChannelAddEditModal kind={kind} open={isAddModalOpen} onOpenChangeAction={setIsAddModalOpen}
                                 adminView={false}
                                 trigger={false}/>
            {hasChannels ? (
                <div className="h-full">
                    <CardsWithPagination
                        data={channels}
                        cardItem={ChannelCard}
                        cardsPerPage={8}
                        numberOfColumns={2}
                        adminView={true}
                        organizations={organizations}
                        kind={kind}
                    />
                </div>
            ) : (
                <EmptyStatePlaceholder
                    text={`No ${channelText} channels configured yet`}
                    onClick={() => {
                        setIsAddModalOpen(true)
                    }}
                    className="h-full"
                />
            )}
        </div>
    );
}