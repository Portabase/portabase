"use client"

import {Check, Pencil, Plus} from "lucide-react";

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
import {ChannelForm} from "@/features/channel/components/channel-form";
import {ChannelKind, getChannelTextBasedOnKind} from "@/features/channel/components/channels-helpers";
import {
    ChannelOrganisationForm
} from "@/features/organizations/components/channels-organization-form";


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
    const [configurationDirty, setConfigurationDirty] = useState(false);
    const [organizationsDirty, setOrganizationsDirty] = useState(false);
    const [step, setStep] = useState<"configuration" | "organizations">("configuration");
    const [configuredChannelId, setConfiguredChannelId] = useState<string | undefined>(channel?.id);
    const [selectedProvider, setSelectedProvider] = useState<string | undefined>(channel?.provider);
    const isLocalSystem = channel?.provider === "local";

    const isCreate = !channel;
    const showOrganizationWizard = adminView === true && !isLocalSystem;

    useEffect(() => {
        setOpen(open);
        if (open) {
            setStep("configuration");
            setConfiguredChannelId(channel?.id);
            setSelectedProvider(channel?.provider);
            setConfigurationDirty(false);
            setOrganizationsDirty(false);
        }
    }, [channel?.id, channel?.provider, open])


    const close = () => {
        onOpenChangeAction?.(false);
        setOpen(false);
    };

    const channelText = getChannelTextBasedOnKind(kind)


    return (
        <Dialog open={openInternal} onOpenChange={(state) => {
            if (state) {
                setStep("configuration");
                setConfiguredChannelId(channel?.id);
                setSelectedProvider(channel?.provider);
                setConfigurationDirty(false);
                setOrganizationsDirty(false);
            }
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
            <DialogContent
                className="grid-rows-[auto_minmax(0,1fr)] max-h-[calc(100vh-4rem)] overflow-hidden"
                onOpenAutoFocus={(e) => e.preventDefault()}
                preventOutsideClose={(isCreate && step === "organizations") || configurationDirty || organizationsDirty}
            >
                <DialogHeader>
                    <DialogTitle> {isCreate ? "Add" : "Edit"} {channelText} Channel</DialogTitle>
                    <DialogDescription>
                        Configure your {channelText.toLowerCase()} channel preferences.
                    </DialogDescription>
                </DialogHeader>
                <div className="-m-1 min-h-0 min-w-0 overflow-y-auto p-1">
                    {isLocalSystem ? (
                        <ChannelOrganisationForm
                            onDirtyChange={setOrganizationsDirty}
                            defaultValues={channel}
                            kind={kind}
                            organizations={organizations}
                        />
                    ) : showOrganizationWizard ? (
                        isCreate ? (
                            <div className="flex flex-col gap-6">
                                {selectedProvider && (
                                <ol aria-label="Channel setup progress" className="flex items-center gap-3 text-sm">
                                    <li className="flex shrink-0 items-center gap-2" aria-current={step === "configuration" ? "step" : undefined}>
                                        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                            {step === "organizations" ? <Check className="size-3.5"/> : 1}
                                        </span>
                                        <span className={step === "configuration" ? "font-medium" : "text-muted-foreground"}>Configuration</span>
                                    </li>
                                    <li className="flex flex-1 items-center gap-3" aria-current={step === "organizations" ? "step" : undefined}>
                                        <span aria-hidden className={`h-0.5 flex-1 rounded-full ${step === "organizations" ? "bg-primary" : "bg-border"}`}/>
                                        <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${step === "organizations" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</span>
                                        <span className={step === "organizations" ? "font-medium" : "text-muted-foreground"}>Organizations</span>
                                    </li>
                                </ol>
                                )}
                                {step === "configuration" ? (
                                    <ChannelForm
                                        onDirtyChange={setConfigurationDirty}
                                        kind={kind}
                                        adminView={adminView}
                                        defaultValues={channel}
                                        organization={organization}
                                        submitLabel="Next"
                                        onCancelAction={close}
                                        onProviderChange={(provider) => setSelectedProvider(provider)}
                                        onSuccessAction={(channelId) => {
                                            setConfiguredChannelId(channelId);
                                            setConfigurationDirty(false);
                                            setStep("organizations");
                                        }}
                                    />
                                ) : (
                                    <ChannelOrganisationForm
                                        onDirtyChange={setOrganizationsDirty}
                                        defaultValues={channel}
                                        channelId={configuredChannelId}
                                        kind={kind}
                                        organizations={organizations}
                                        submitLabel="Finish"
                                        showEmptySelectionWarning
                                        onSuccessAction={close}
                                    />
                                )}
                            </div>
                        ) : (
                            <Tabs className="flex flex-col flex-1" defaultValue="configuration">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                                    <TabsTrigger value="organizations">Organizations</TabsTrigger>
                                </TabsList>
                                <TabsContent forceMount className="h-full justify-between data-[state=inactive]:hidden" value="configuration">
                                    <ChannelForm
                                        onDirtyChange={setConfigurationDirty}
                                        kind={kind}
                                        adminView={adminView}
                                        defaultValues={channel}
                                        organization={organization}
                                        onCancelAction={close}
                                        onSuccessAction={() => setConfigurationDirty(false)}
                                    />
                                </TabsContent>
                                <TabsContent forceMount className="h-full justify-between data-[state=inactive]:hidden" value="organizations">
                                    <ChannelOrganisationForm
                                        onDirtyChange={setOrganizationsDirty}
                                        defaultValues={channel}
                                        kind={kind}
                                        organizations={organizations}
                                        onSuccessAction={() => setOrganizationsDirty(false)}
                                    />
                                </TabsContent>
                            </Tabs>
                        )
                    ) : (
                        <ChannelForm
                            onDirtyChange={setConfigurationDirty}
                            kind={kind}
                            adminView={adminView}
                            defaultValues={channel}
                            organization={organization}
                            onCancelAction={close}
                            onSuccessAction={close}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
