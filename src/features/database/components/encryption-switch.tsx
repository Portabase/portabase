"use client";

import {Lock} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {InfoTooltip} from "@/features/stats/components/info-tooltip";
import {type EncryptionScope, updateEncryptionAction} from "@/features/database/actions/encryption.action";
import type {EncryptionLevel} from "@/features/database/utils/policy-resolution";

export type EncryptionSwitchProps = {
    scope: EncryptionScope;
    enabled: boolean;
    enforcedBy: EncryptionLevel | null;
    queryKey?: unknown[];
};

export const EncryptionSwitch = ({scope, enabled, enforcedBy, queryKey}: EncryptionSwitchProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const switchId = `encryption-${scope.type}-${scope.id}`;

    const updateEncryption = useMutation({
        mutationFn: async (nextEnabled: boolean) => {
            const result = await updateEncryptionAction({scope, enabled: nextEnabled});
            if (!result?.data) throw new Error(result?.serverError ?? "Encryption update failed");
        },
        onSuccess: () => {
            toast.success("Encryption updated.");
            if (queryKey) queryClient.invalidateQueries({queryKey});
            router.refresh();
        },
        onError: () => {
            toast.error("An error occurred while updating encryption.");
        },
    });

    return (
        <div className="flex h-9 items-center gap-2 rounded-md border px-3">
            <Lock className="size-4"/>
            <Label htmlFor={switchId}>Encrypt backups</Label>
            <Switch
                id={switchId}
                checked={enabled || enforcedBy !== null}
                disabled={enforcedBy !== null || updateEncryption.isPending}
                onCheckedChange={(checked) => updateEncryption.mutate(checked)}
            />
            {enforcedBy && <InfoTooltip content={`Enforced by ${enforcedBy}`}/>}
        </div>
    );
};
