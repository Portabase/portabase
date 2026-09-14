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

type StorageSftpFormProps = {
    form: UseFormReturn<any, any, any>;
};

export const StorageSftpForm = ({form}: StorageSftpFormProps) => {
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
        </>
    );
};
