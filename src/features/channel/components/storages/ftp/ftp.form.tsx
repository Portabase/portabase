import type {FieldValues, UseFormReturn} from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

type StorageFtpFormProps = { form: UseFormReturn<FieldValues> };

export const StorageFtpForm = ({form}: StorageFtpFormProps) => (
    <>
        <Separator className="my-1"/>
        <FormField
            control={form.control}
            name="config.host"
            render={({field}) => (
                <FormItem className="min-w-0">
                    <FormLabel>Host *</FormLabel>
                    <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="ftp.example.com"/>
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
                        <Input {...field} type="number" value={field.value ?? ""} placeholder="21"/>
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
                        <Input {...field} value={field.value ?? ""} placeholder="backup"/>
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
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                        <Input
                            {...field}
                            type="password"
                            value={field.value ?? ""}
                            autoComplete="new-password"
                        />
                    </FormControl>
                    <FormMessage/>
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="config.ftpsMode"
            render={({field}) => (
                <FormItem className="min-w-0">
                    <FormLabel>Security</FormLabel>
                    <Select value={field.value ?? "none"} onValueChange={field.onChange}>
                        <FormControl>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select security"/>
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="none">FTP (unencrypted)</SelectItem>
                            <SelectItem value="explicit">Explicit FTPS</SelectItem>
                            <SelectItem value="implicit">Implicit FTPS</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-muted-foreground text-xs">
                        FTP and explicit FTPS commonly use port 21; implicit FTPS commonly uses port 990.
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
                    <p className="text-muted-foreground text-xs break-words">
                        Optional prefix. Backups go under <code>backups/YYYY-MM-DD/</code> beneath it.
                    </p>
                    <FormMessage/>
                </FormItem>
            )}
        />
    </>
);
