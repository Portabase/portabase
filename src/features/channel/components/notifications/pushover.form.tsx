import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {PasswordInput} from "@/components/ui/password-input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {PUSHOVER_PRIORITIES} from "@/features/channel/components/notifications/pushover.schema";

type NotifierPushoverFormProps = {
    form: UseFormReturn<any, any, any>;
};

export const NotifierPushoverForm = ({form}: NotifierPushoverFormProps) => {
    return (
        <>
            <Separator className="my-1"/>

            <FormField
                control={form.control}
                name="config.pushoverUserKey"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>User Key *</FormLabel>
                        <FormControl>
                            <PasswordInput {...field} placeholder="Your 30-character Pushover user key"/>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            Found at the top of your Pushover dashboard at pushover.net.
                        </p>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.pushoverApiToken"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>App API Token *</FormLabel>
                        <FormControl>
                            <PasswordInput {...field} placeholder="Your 30-character application API token"/>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            Create an application at pushover.net/apps to get an API token.
                        </p>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <Separator className="my-1"/>

            <FormField
                control={form.control}
                name="config.pushoverPriority"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Message Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? "0"}>
                            <FormControl>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select priority"/>
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {PUSHOVER_PRIORITIES.map((p) => (
                                    <SelectItem key={p.value} value={p.value}>
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Emergency priority repeats every 60 seconds until acknowledged (max 1 hour).
                        </p>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.pushoverDevice"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Device Name</FormLabel>
                        <FormControl>
                            <Input {...field} value={field.value ?? ""} placeholder="e.g. iphone (leave empty for all devices)"/>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            Target a specific registered device. Leave empty to send to all devices.
                        </p>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        </>
    );
};
