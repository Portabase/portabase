import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {NotificationChannel} from "@/db/schema/09_notification-channel";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {EmptyStatePlaceholder} from "@/components/wrappers/common/empty-state-placeholder";
import {useState} from "react";
import {cn} from "@/lib/utils";
import {ChannelAddEditModal} from "@/components/wrappers/dashboard/admin/channels/channel/channel-add-edit-modal";
import {ChannelCard} from "@/components/wrappers/dashboard/admin/channels/channel/channel-card/channel-card";

export type OrganizationNotifiersTabProps = {
    organization: OrganizationWithMembers;
    notificationChannels: NotificationChannel[];
};

export const OrganizationNotifiersTab = ({
                                             organization,
                                             notificationChannels,
                                         }: OrganizationNotifiersTabProps) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const hasNotifiers = notificationChannels.length > 0;
    const kind="notification"
    return (
        <div className="flex flex-col gap-y-6 h-full py-4">
            <div className="h-full flex flex-col gap-y-6">
                <div className={cn("hidden flex-row justify-between items-start", hasNotifiers && "flex")}>
                    <div className="max-w-2xl ">
                        <h3 className="text-xl font-semibold text-balance mb-1">
                            Notification Settings
                        </h3>
                    </div>
                    {/*<NotifierAddEditModal*/}
                    {/*    organization={organization}*/}
                    {/*    open={isAddModalOpen}*/}
                    {/*    onOpenChangeAction={setIsAddModalOpen}*/}
                    {/*/>*/}
                    <ChannelAddEditModal
                        kind={kind}
                        organization={organization}
                        open={isAddModalOpen}
                        onOpenChangeAction={setIsAddModalOpen}
                    />
                </div>
                {hasNotifiers ? (
                    <div className="h-full">
                        <CardsWithPagination
                            data={notificationChannels}
                            cardItem={ChannelCard}
                            cardsPerPage={8}
                            numberOfColumns={2}
                            organization={organization}
                            kind={kind}
                        />
                    </div>
                ) : (
                    <EmptyStatePlaceholder
                        text="No notification channels configured yet"
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-full"
                    />
                )}
            </div>
        </div>
    );
};