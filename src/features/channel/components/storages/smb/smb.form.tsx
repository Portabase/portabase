import type {UseFormReturn} from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";

type StorageSmbFormProps = {
    form: UseFormReturn;
};

export const StorageSmbForm = ({form}: StorageSmbFormProps) => (
    <>
        <Separator className="my-1"/>
        <FormField
            control={form.control}
            name="config.host"
            render={({field}) => (
                <FormItem className="min-w-0">
                    <FormLabel>Host *</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="samba.example.com"/></FormControl>
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
                    <FormControl><Input {...field} type="number" value={field.value ?? ""} placeholder="445"/></FormControl>
                    <FormMessage/>
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="config.share"
            render={({field}) => (
                <FormItem className="min-w-0">
                    <FormLabel>Share *</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="backups"/></FormControl>
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
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="portabase"/></FormControl>
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
                    <FormControl><Input {...field} type="password" value={field.value ?? ""} autoComplete="new-password"/></FormControl>
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
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="e.g. /daily"/></FormControl>
                    <p className="text-muted-foreground text-xs break-words">
                        Optional path below the share. Backups go under <code>backups/YYYY-MM-DD/</code> beneath it.
                    </p>
                    <FormMessage/>
                </FormItem>
            )}
        />
    </>
);
