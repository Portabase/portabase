import {UseFormReturn} from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {Textarea} from "@/components/ui/textarea";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {Info} from "lucide-react";

type StorageSftpFormProps = {
    form: UseFormReturn<any, any, any>;
};

export const StorageSftpForm = ({form}: StorageSftpFormProps) => {
    const keyscan = `ssh-keyscan -p ${form.watch("config.port") || 22} ${form.watch("config.host") || "your-host"}`;
    return (
        <>
            <Separator className="my-1"/>
            <FormField
                control={form.control}
                name="config.host"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel>Host *</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder="backup.example.com"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.port"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel>Port</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="number"
                                value={field.value ?? ""}
                                placeholder="22"
                            />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.username"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel>Username *</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder="deploy"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.password"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="password"
                                value={field.value ?? ""}
                                autoComplete="new-password"
                                placeholder="Password or private key required"
                            />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.privateKey"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel>Private key (PEM)</FormLabel>
                        <FormControl>
                            <Textarea
                                {...field}
                                value={field.value ?? ""}
                                rows={6}
                                className="font-mono text-xs w-full break-all"
                                placeholder={"-----BEGIN OPENSSH PRIVATE KEY-----\n…"}
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground break-words">
                            Provide a password or a private key (or both).
                        </p>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.remotePath"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel>Remote path</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder="e.g. /srv/backups"/>
                        </FormControl>
                        <p className="text-xs text-muted-foreground break-words">
                            Optional prefix. Backups go under <code>backups/YYYY-MM-DD/</code> beneath it.
                        </p>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.connections"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel>Max connections</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                type="number"
                                min={1}
                                value={field.value ?? ""}
                                placeholder="Unlimited"
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground break-words">
                            Optional. Applies to each backup job: keep jobs running at the same time under your
                            server&apos;s limit (a Hetzner Storage Box allows 10).
                        </p>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.hostKeys"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel className="flex items-center gap-1.5">
                            Host key
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="What the host key is for"
                                        className="text-muted-foreground hover:text-foreground focus-visible:outline-none"
                                    >
                                        <Info className="h-3.5 w-3.5"/>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    className="max-w-xs space-y-1.5 text-xs text-left"
                                >
                                    <p>
                                        Backups are only sent to the server with this key, never to one
                                        impersonating it.
                                    </p>
                                    <p>Run the command on a trusted machine and paste the whole output.</p>
                                    <p>
                                        If the server&apos;s key changes, backups stop until you paste the new
                                        one. Leave empty to connect without checking.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </FormLabel>
                        <FormControl>
                            <Textarea
                                {...field}
                                value={field.value ?? ""}
                                rows={3}
                                className="font-mono text-xs w-full break-all"
                                placeholder="ssh-ed25519 AAAA…"
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground break-words">
                            Recommended. Paste the output of <code className="break-all">{keyscan}</code>.
                        </p>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        </>
    );
};
