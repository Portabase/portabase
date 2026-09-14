import {useEffect} from "react";
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
import {ExternalLink, Info} from "lucide-react";
import {
    BLOCKED_BACKEND_TYPES,
    parseRemoteNames,
} from "@/features/channel/components/storages/rclone/rclone.parse";

type StorageRcloneFormProps = {
    form: UseFormReturn<any, any, any>;
};

const CONFIG_PLACEHOLDER = `[my-remote]
type = s3
provider = Other
access_key_id = ACCESS_KEY_ID
secret_access_key = SECRET_ACCESS_KEY
region = us-east-1
endpoint = https://s3.example.com
acl = private`;

export const StorageRcloneForm = ({form}: StorageRcloneFormProps) => {
    const configText: string = form.watch("config.configText") ?? "";
    const remoteName: string = form.watch("config.remoteName") ?? "";
    const remotes = parseRemoteNames(configText);

    const soleRemote = remotes.length === 1 ? remotes[0] : "";
    const remote = remoteName || "remote";
    useEffect(() => {
        if (remoteName !== soleRemote) {
            form.setValue("config.remoteName", soleRemote, {shouldValidate: true});
        }
    }, [soleRemote, remoteName, form]);

    return (
        <>
            <Separator className="my-1"/>
            <FormField
                control={form.control}
                name="config.configText"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel className="flex items-center gap-1.5">
                            rclone config *
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="Which backend types are not supported"
                                        className="text-muted-foreground hover:text-foreground focus-visible:outline-none"
                                    >
                                        <Info className="h-3.5 w-3.5"/>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="right"
                                    className="max-w-xs space-y-1.5 text-xs text-left"
                                >
                                    <p>These backend types are rejected:</p>
                                    <p className="font-mono break-words">
                                        {BLOCKED_BACKEND_TYPES.join(", ")}
                                    </p>
                                    <p>
                                        Wrapping backends need a second remote to wrap, and a
                                        channel holds a single section.{" "}
                                        <code className="break-all">local</code> and{" "}
                                        <code className="break-all">alias</code> would reach the
                                        container filesystem.{" "}
                                        <code className="break-all">memory</code>,{" "}
                                        <code className="break-all">http</code> and{" "}
                                        <code className="break-all">googlephotos</code> cannot
                                        store a backup.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </FormLabel>
                        <FormControl>
                            <Textarea
                                {...field}
                                value={field.value ?? ""}
                                rows={10}
                                className="font-mono text-xs w-full break-all"
                                placeholder={CONFIG_PLACEHOLDER}
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground break-words">
                            Paste exactly one <code className="break-all">[section]</code> from your rclone.conf.
                            The section header names the remote.
                        </p>
                        <a
                            href="https://rclone.org/#providers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground w-fit"
                        >
                            Rclone provider list
                            <ExternalLink className="h-3 w-3"/>
                        </a>
                        {soleRemote ? (
                            <p className="text-xs text-muted-foreground break-words">
                                Remote detected: <code className="break-all">{soleRemote}</code>
                            </p>
                        ) : null}
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.remotePath"
                render={({field}) => (
                    <FormItem className="min-w-0">
                        <FormLabel className="flex items-center gap-1.5">
                            Remote path
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        type="button"
                                        aria-label="About the remote path"
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
                                        Optional prefix, so you can point at storage already
                                        used for other things.
                                    </p>
                                    <p>
                                        Backups always go under{" "}
                                        <code className="break-all">backups/YYYY-MM-DD/</code>{" "}
                                        beneath it — <code className="break-all">my-bucket</code>{" "}
                                        becomes{" "}
                                        <code className="break-all">{`${remote}:my-bucket/backups/…`}</code>,
                                        empty becomes{" "}
                                        <code className="break-all">{`${remote}:backups/…`}</code>.
                                    </p>
                                    <p>
                                        On S3-style remotes the first segment is the{" "}
                                        <strong>bucket</strong>, so leaving this empty targets a
                                        bucket named <code className="break-all">backups</code>.
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? ""}
                                placeholder="e.g. my-bucket"
                            />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        </>
    );
};
