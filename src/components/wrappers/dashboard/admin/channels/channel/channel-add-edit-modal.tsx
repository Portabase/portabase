"use client"

import {Pencil, Plus} from "lucide-react";

import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {OrganizationWithMembers} from "@/db/schema/03_organization";
import {NotificationChannelWith} from "@/db/schema/09_notification-channel";
import {useIsMobile} from "@/hooks/use-mobile";
import {useEffect, useState} from "react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {StorageChannelWith} from "@/db/schema/12_storage-channel";
import {ChannelForm} from "@/components/wrappers/dashboard/admin/channels/channel/channel-form/channel-form";
import {ChannelKind, getChannelTextBasedOnKind} from "@/components/wrappers/dashboard/admin/channels/helpers/common";
import {
    ChannelOrganisationForm
} from "@/components/wrappers/dashboard/admin/channels/organization/channels-organization-form";

type ChannelAddModalProps = {
    channel?: NotificationChannelWith | StorageChannelWith
    organization?: OrganizationWithMembers;
    open?: boolean;
    onOpenChangeAction?: (open: boolean) => void;
    adminView?: boolean;
    organizations?: OrganizationWithMembers[]
    trigger?: boolean;
    kind: ChannelKind;
}


export const ChannelAddEditModal = ({
                                        organization,
                                        channel,
                                        open = false,
                                        onOpenChangeAction,
                                        adminView,
                                        organizations,
                                        trigger = true,
                                        kind
                                    }: ChannelAddModalProps) => {
    const isMobile = useIsMobile();
    const [openInternal, setOpen] = useState(open);
    const isLocalSystem = channel?.provider == "local";

    const isCreate = !Boolean(channel);

    useEffect(() => {
        setOpen(open);
    }, [open])


    const channelText = getChannelTextBasedOnKind(kind)


    return (
        <Dialog open={openInternal} onOpenChange={(state) => {
            onOpenChangeAction?.(state);
            setOpen(state);
        }}>
            {trigger && (
                <DialogTrigger asChild>
                    {isCreate ?
                        <Button>
                            <Plus/>{!isMobile && `Add ${channelText} channel`}
                        </Button>
                        :
                        <Button
                            variant="ghost"
                            size="icon"
                        >
                            <Pencil className="h-4 w-4"/>
                        </Button>
                    }
                </DialogTrigger>
            )}
            <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle> {isCreate ? "Add" : "Edit"} {channelText} Channel</DialogTitle>
                    <DialogDescription>
                        Configure your {channelText.toLowerCase()} channel preferences.
                    </DialogDescription>
                </DialogHeader>
                <div>
                    <>
                        {!isLocalSystem ? (
                                <>
                                    {adminView ?
                                        <Tabs className="flex flex-col flex-1" defaultValue="configuration">
                                            <TabsList className="grid w-full grid-cols-2">
                                                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                                                <TabsTrigger value="organizations">Organizations</TabsTrigger>
                                            </TabsList>
                                            <TabsContent className="h-full justify-between" value="configuration">
                                                <ChannelForm
                                                    kind={kind}
                                                    adminView={adminView}
                                                    defaultValues={channel}
                                                    organization={organization}
                                                    onSuccessAction={() => {
                                                        onOpenChangeAction?.(false)
                                                        setOpen(false);
                                                    }}
                                                />
                                            </TabsContent>
                                            <TabsContent className="h-full justify-between" value="organizations">
                                                <ChannelOrganisationForm
                                                    defaultValues={channel}
                                                    kind={kind}
                                                    organizations={organizations}
                                                />
                                            </TabsContent>
                                        </Tabs>
                                        :
                                        <>
                                            <ChannelForm
                                                kind={kind}
                                                adminView={adminView}
                                                defaultValues={channel}
                                                organization={organization}
                                                onSuccessAction={() => {
                                                    onOpenChangeAction?.(false)
                                                    setOpen(false);
                                                }}
                                            />
                                        </>
                                    }
                                </>
                            )

                            :

                            <>
                                <ChannelOrganisationForm
                                    defaultValues={channel}
                                    kind={kind}
                                    organizations={organizations}
                                />
                            </>
                        }


                    </>
                </div>
            </DialogContent>
        </Dialog>
    )
}
