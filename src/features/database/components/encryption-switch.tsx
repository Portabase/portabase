"use client";

import {Lock, LockOpen} from "lucide-react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Button} from "@/components/ui/button";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import {InfoTooltip} from "@/features/stats/components/info-tooltip";
import {type EncryptionScope, updateEncryptionAction} from "@/features/database/actions/encryption.action";
import type {EncryptionLevel} from "@/features/database/utils/policy-resolution";

export type EncryptionSwitchProps = {
    scope: EncryptionScope;
    enabled: boolean;
    enforcedBy: EncryptionLevel | null;
    queryKey?: unknown[];
};

function useUpdateEncryption(scope: EncryptionScope, queryKey?: unknown[]) {
    const queryClient = useQueryClient();
    const router = useRouter();

    return useMutation({
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
}

export const EncryptionSwitch = ({scope, enabled, enforcedBy, queryKey}: EncryptionSwitchProps) => {
    const updateEncryption = useUpdateEncryption(scope, queryKey);
    const switchId = `encryption-${scope.type}-${scope.id}`;

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

export const EncryptionToggleButton = ({scope, enabled, enforcedBy, queryKey}: EncryptionSwitchProps) => {
    const updateEncryption = useUpdateEncryption(scope, queryKey);
    const encrypted = enabled || enforcedBy !== null;
    const label = enforcedBy
        ? `Backups encrypted, enforced by ${enforcedBy}`
        : encrypted
            ? "Backups encrypted, click to disable"
            : "Backups not encrypted, click to encrypt";

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span>
                    <Button
                        variant="outline"
                        aria-label={label}
                        aria-pressed={encrypted}
                        disabled={enforcedBy !== null || updateEncryption.isPending}
                        onClick={() => updateEncryption.mutate(!enabled)}
                    >
                        {encrypted ? <Lock/> : <LockOpen/>}
                    </Button>
                </span>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
};
