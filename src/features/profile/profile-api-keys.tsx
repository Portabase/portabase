"use client";

import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Check, Copy, KeyRound, Loader2, Plus, Trash2} from "lucide-react";
import {useMutation, useQuery} from "@tanstack/react-query";
import {toast} from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {useState} from "react";
import {timeAgo} from "@/utils/date-formatting";
import {
    createApiKeysAction,
    deleteApiKeyAction,
    getApiKeysAction,
} from "@/features/profile/profile.action";
import {copyToClipboardWithMeta} from "@/components/common/copy-button";
import Link from "next/link";
import {useAcl} from "@/lib/acl/acl-context";

export function ProfileApiKeys() {
    const {isSuperAdminAndDemo} = useAcl();
    const [isAddApiKeyOpen, setIsAddApiKeyOpen] = useState(false);
    const [apiKeyName, setApiKeyName] = useState("");
    const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
    const [copiedApiKey, setCopiedApiKey] = useState(false);

    const {
        data: apikeys,
        isLoading: isLoadingApiKeys,
        refetch: refetchApiKeys,
    } = useQuery({
        queryKey: ["apikeys"],
        queryFn: async () => {
            const result = await getApiKeysAction();
            if (result?.data?.success) return result.data.value;
            throw new Error("Failed to fetch API Keys");
        },
    });

    const {mutate: addApiKey, isPending: isAddingApikey} = useMutation({
        mutationFn: async () => {
            const result = await createApiKeysAction({
                name: apiKeyName || "My API Key",
            });
            if (!result?.data?.success) throw new Error("Failed to create API Key");
            return result;
        },
        onSuccess: (result: any) => {
            setCreatedApiKey(result.data.value.key);
            toast.success("API Key created successfully");
            setIsAddApiKeyOpen(false);
            setApiKeyName("");
            refetchApiKeys();
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to create API Key");
        },
    });

    const {mutate: revokeApiKey, isPending: isRevokingApiKey} = useMutation({
        mutationFn: async (id: string) => {
            const result = await deleteApiKeyAction({id});
            if (!result?.data?.success) throw new Error("Failed to revoke API Key");
        },
        onSuccess: () => {
            toast.success("API Key revoked successfully");
            refetchApiKeys();
        },
        onError: () => {
            toast.error("Failed to revoke API Key");
        },
    });

    const handleCopyApiKey = async () => {
        if (!createdApiKey) return;
        await copyToClipboardWithMeta(createdApiKey);
        setCopiedApiKey(true);
        toast.success("API Key copied");
        setTimeout(() => setCopiedApiKey(false), 2000);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-lg font-medium">API Keys</h3>
                        <div className="text-sm text-muted-foreground">
                            Manage your personal access tokens for API authentication.{" "}
                            <Link
                                href="https://portabase.io/docs/dashboard/api/introduction"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline underline-offset-4 hover:text-foreground transition-colors"
                            >
                                View docs
                            </Link>
                        </div>
                    </div>

                    <Dialog open={isAddApiKeyOpen} onOpenChange={setIsAddApiKeyOpen}>
                        <DialogTrigger asChild disabled={isSuperAdminAndDemo}>
                            <Button variant="outline" size="sm" disabled={isSuperAdminAndDemo}>
                                <Plus className="mr-2 h-4 w-4"/>
                                Add API Key
                            </Button>
                        </DialogTrigger>

                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New API Key</DialogTitle>
                                <DialogDescription>
                                    Give a name to your API Key to identify it later.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Key Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. flow-1, LLM, Backend"
                                        value={apiKeyName}
                                        onChange={(e) => setApiKeyName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsAddApiKeyOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button onClick={() => addApiKey()} disabled={isAddingApikey}>
                                    {isAddingApikey && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    )}
                                    Create API Key
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="border rounded-lg divide-y">
                    {isLoadingApiKeys ? (
                        <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                        </div>
                    ) : apikeys && apikeys.length > 0 ? (
                        apikeys.map((ak: any) => (
                            <ApiKeyRow
                                key={ak.id}
                                apikey={ak}
                                onRevoke={(id) => revokeApiKey(id)}
                                isRevoking={isRevokingApiKey}
                                disabled={isSuperAdminAndDemo}
                            />
                        ))
                    ) : (
                        <div className="p-4 text-center text-muted-foreground">
                            No API Key found.
                        </div>
                    )}
                </div>
            </div>

            <Dialog
                open={!!createdApiKey}
                onOpenChange={(open) => {
                    if (!open) setCreatedApiKey(null);
                }}
            >
                <DialogContent onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle>Your API Key</DialogTitle>
                        <DialogDescription>
                            This API Key will only be displayed once.
                            <br/>
                            Copy it now before closing this dialog.
                            <br/>
                            For security reasons, it cannot be viewed again.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Input
                                readOnly
                                value={createdApiKey || ""}
                                className="font-mono"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleCopyApiKey}
                            >
                                {copiedApiKey ? (
                                    <Check className="w-4 h-4"/>
                                ) : (
                                    <Copy className="w-4 h-4"/>
                                )}
                            </Button>
                        </div>

                        <div
                            className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                            Store this API Key securely. You will not be able to see it
                            again after closing this dialog.
                        </div>
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setCreatedApiKey(null)}>
                            I copied my API Key
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ApiKeyRow({
                       apikey,
                       onRevoke,
                       isRevoking,
                       disabled,
                   }: {
    apikey: any;
    onRevoke: (id: string) => void;
    isRevoking: boolean;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <KeyRound className="w-5 h-5"/>
                </div>

                <div className="space-y-1">
                    <div className="font-medium text-sm">
                        {apikey.name || "Unnamed API Key"}
                    </div>

                    {apikey?.start && apikey?.prefix ? (
                        <div className="text-xs font-mono text-muted-foreground">
                            {apikey.start}••••••••
                        </div>
                    ) : null}

                    <div className="text-xs text-muted-foreground">
                        Created {timeAgo(new Date(apikey.createdAt))}
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => onRevoke(apikey.id)}
                disabled={isRevoking || disabled}
            >
                {isRevoking ? (
                    <Loader2 className="h-4 w-4 animate-spin"/>
                ) : (
                    <Trash2 className="w-4 h-4"/>
                )}
                <span className="sr-only">Revoke</span>
            </Button>
        </div>
    );
}
