import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {CardsWithPagination} from "@/components/common/cards-with-pagination";
import {EmptyStatePlaceholder} from "@/components/common/empty-state-placeholder";
import {useState} from "react";
import {cn} from "@/lib/utils";
import {ChannelAddEditModal} from "@/features/channel/components/channel-add-edit-modal";
import {ChannelCard} from "@/features/channel/components/channel-card";
import {StorageChannel} from "@/db/schema/12_storage-channel";
import {EncryptionSwitch} from "@/features/database/components/encryption-switch";
import type {EncryptionLevel} from "@/features/database/utils/policy-resolution";

export type OrganizationEncryption = {
    enabled: boolean;
    enforcedBy: EncryptionLevel | null;
};

export type OrganizationNotifiersTabProps = {
    organization: OrganizationWithMembers;
    storageChannels: StorageChannel[];
    encryption: OrganizationEncryption;
};

export const OrganizationStoragesTab = ({
                                            organization,
                                            storageChannels,
                                            encryption,
                                        }: OrganizationNotifiersTabProps) => {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const hasNotifiers = storageChannels.length > 0;
    const kind = "storage"
    return (
        <div className="flex flex-col gap-y-6 h-full py-4">
            <div className="flex">
                <EncryptionSwitch
                    scope={{type: "organization", id: organization.id}}
                    enabled={encryption.enabled}
                    enforcedBy={encryption.enforcedBy}
                />
            </div>
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