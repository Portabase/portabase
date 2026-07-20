import type { UseFormReturn } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

type NotifierAppriseFormProps = {
    form: UseFormReturn<any, any, any>;
};

export const NotifierAppriseForm = ({ form }: NotifierAppriseFormProps) => {
    return (
        <>
            <Separator className="my-1" />

            <FormField
                control={form.control}
                name="config.appriseServerUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Apprise Server URL *</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. http://localhost:8000" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            Base URL of your Apprise API server.
                        </p>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.appriseConfigKey"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Config Key *</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. my-alerts" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            The persistent config key registered on your Apprise server. Sends to POST /notify/&#123;key&#125;.
                        </p>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    );
};
