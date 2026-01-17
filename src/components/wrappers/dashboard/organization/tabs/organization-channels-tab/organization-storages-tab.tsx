import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {CardsWithPagination} from "@/components/wrappers/common/cards-with-pagination";
import {EmptyStatePlaceholder} from "@/components/wrappers/common/empty-state-placeholder";
import {useState} from "react";
import {cn} from "@/lib/utils";
import {ChannelAddEditModal} from "@/components/wrappers/dashboard/admin/channels/channel/channel-add-edit-modal";
import {ChannelCard} from "@/components/wrappers/dashboard/admin/channels/channel/channel-card/channel-card";
import {StorageChannel} from "@/db/schema/12_storage-channel";

export type OrganizationNotifiersTabProps = {
    organization: OrganizationWithMembers;
    storageChannels: StorageChannel[];
};

export const OrganizationStoragesTab = ({
                                            organization,
                                            storageChannels,
                                        }: OrganizationNotifiersTabProps) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const hasNotifiers = storageChannels.length > 0;
    const kind = "storage"
    return (
        <div className="flex flex-col gap-y-6 h-full py-4">
            <div className="h-full flex flex-col gap-y-6">
                <div className={cn("hidden flex-row justify-between items-start", hasNotifiers && "flex")}>
                    <div className="max-w-2xl ">
                        <h3 className="text-xl font-semibold text-balance mb-1">
                            Notification Settings
                        </h3>
                    </div>
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
                            data={storageChannels}
                            cardItem={ChannelCard}
                            cardsPerPage={8}
                            numberOfColumns={2}
                            organization={organization}
                            kind={kind}
                        />
                    </div>
                ) : (
                    <EmptyStatePlaceholder
                        text="No storage channels configured yet"
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-full"
                    />
                )}
            </div>
        </div>
    );
};