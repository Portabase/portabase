"use client";

import { ReactNode, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { DatabaseWith } from "@/db/schema/07_database";
import { NotificationChannel } from "@/db/schema/09_notification-channel";
import { StorageChannel } from "@/db/schema/12_storage-channel";
import { ChannelKind, getChannelTextBasedOnKind } from "@/features/channel/components/channels-helpers";
import { ChannelPoliciesForm } from "@/features/database/components/channels-policy-form";
import { PolicyType } from "@/features/database/schemas/channels-policy.schema";
import {
    createAlertPoliciesAction,
    createStoragePoliciesAction,
    deleteAlertPoliciesAction,
    deleteStoragePoliciesAction,
    updateAlertPoliciesAction,
    updateStoragePoliciesAction,
} from "@/features/database/actions/channels-policy.action";
import { backupOnly } from "@/features/database/components/database-tabs";

type ChannelPoliciesModalProps = {
    database: DatabaseWith;
    channels: NotificationChannel[] | StorageChannel[];
    organizationId: string;
    kind: ChannelKind;
    icon: ReactNode;
};

export const ChannelPoliciesModal = ({ icon, kind, database, channels, organizationId }: ChannelPoliciesModalProps) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const router = useRouter();
    const channelText = getChannelTextBasedOnKind(kind);

    const channelsFiltered = channels.filter((c) => c.enabled);
    const channelIds = channelsFiltered.map((c) => c.id);

    const defaultPolicies: PolicyType[] =
        kind === "notification"
            ? (database.alertPolicies ?? [])
                  .filter((p) => channelIds.includes(p.notificationChannelId))
                  .map(({ notificationChannelId, eventKinds, enabled }) => ({
                      channelId: notificationChannelId,
                      eventKinds,
                      enabled,
                  }))
            : (database.storagePolicies ?? [])
                  .filter((p) => channelIds.includes(p.storageChannelId))
                  .map(({ storageChannelId, enabled }) => ({ channelId: storageChannelId, enabled }));

    const activePolicies = kind === "notification"
        ? database.alertPolicies?.filter((p) => channelIds.includes(p.notificationChannelId))
        : database.storagePolicies?.filter((p) => channelIds.includes(p.storageChannelId));

    const mutation = useMutation({
        mutationFn: async (policies: PolicyType[]) => {
            const payload = policies.map((p) =>
                kind === "notification" ? p : { ...p, eventKinds: undefined },
            );

            const toAdd = payload.filter((p) => !defaultPolicies.some((d) => d.channelId === p.channelId));
            const toRemove = defaultPolicies.filter((d) => !payload.some((p) => p.channelId === d.channelId));
            const toUpdate = payload.filter((p) => {
                const existing = defaultPolicies.find((d) => d.channelId === p.channelId);
                return existing && (existing.eventKinds !== p.eventKinds || existing.enabled !== p.enabled);
            });

            const results = await Promise.allSettled(
                kind === "notification"
                    ? [
                          toAdd.length > 0
                              ? createAlertPoliciesAction({ databaseId: database.id, alertPolicies: toAdd })
                              : null,
                          toUpdate.length > 0
                              ? updateAlertPoliciesAction({ databaseId: database.id, alertPolicies: toUpdate })
                              : null,
                          toRemove.length > 0
                              ? deleteAlertPoliciesAction({ databaseId: database.id, alertPolicies: toRemove })
                              : null,
                      ]
                    : [
                          toAdd.length > 0
                              ? createStoragePoliciesAction({ databaseId: database.id, storagePolicies: toAdd })
                              : null,
                          toUpdate.length > 0
                              ? updateStoragePoliciesAction({ databaseId: database.id, storagePolicies: toUpdate })
                              : null,
                          toRemove.length > 0
                              ? deleteStoragePoliciesAction({ databaseId: database.id, storagePolicies: toRemove })
                              : null,
                      ],
            );

            const rejected = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
            if (rejected) throw new Error(rejected.reason?.message || "Network or server error");

            const failed = results
                .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
                .map((r) => r.value)
                .filter((v): v is { data: { success: false; actionError: any } } => v !== null && v.data?.success === false);

            if (failed.length > 0) throw new Error(failed[0].data.actionError?.message || "One or more operations failed");
        },
        onSuccess: () => {
            toast.success("Policies saved successfully");
            queryClient.invalidateQueries({ queryKey: ["database-data", database.id] });
            router.refresh();
            setOpen(false);
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to save policies");
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => setOpen(true)} className="relative">
                    {icon}
                    {activePolicies && activePolicies.length > 0 && (
                        <Badge className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full p-0 text-[10px] flex items-center justify-center">
                            {activePolicies.length}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{channelText} policies</DialogTitle>
                    <DialogDescription>
                        Add and manage your database {channelText.toLowerCase()} policies
                    </DialogDescription>
                    <Separator className="mt-3 mb-3" />
                    <ChannelPoliciesForm
                        channels={channelsFiltered.map((c) => ({ id: c.id, name: c.name, provider: c.provider }))}
                        defaultPolicies={defaultPolicies}
                        kind={kind}
                        isBackupOnly={backupOnly.some((t) => database.dbms === t)}
                        isPending={mutation.isPending}
                        onSave={mutation.mutateAsync}
                        onCancel={() => setOpen(false)}
                        noChannelsMessage={
                            <p className="text-xs text-muted-foreground max-w-xs">
                                Please{" "}
                                <Link
                                    href="/dashboard/settings"
                                    className="underline underline-offset-4 hover:text-primary transition-colors"
                                >
                                    configure {channelText.toLowerCase()} channels
                                </Link>{" "}
                                in your organization settings first.
                            </p>
                        }
                    />
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};
