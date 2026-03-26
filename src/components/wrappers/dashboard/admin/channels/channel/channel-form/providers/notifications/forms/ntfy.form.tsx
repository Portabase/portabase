import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {PasswordInput} from "@/components/ui/password-input";

type NotifierNtfyFormProps = {
    form: UseFormReturn<any, any, any>
}

export const NotifierNtfyForm = ({form}: NotifierNtfyFormProps) => {
    return (
        <>
            <Separator className="my-1"/>

            <FormField
                control={form.control}
                name="config.ntfyTopic"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Topic Name *</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. team-alerts"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.ntfyServerUrl"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Server URL</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. https://ntfy.example.com"/>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Leave empty to use the official ntfy.sh server.</p>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.ntfyToken"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Access Token</FormLabel>
                        <FormControl>
                            <PasswordInput {...field} placeholder="e.g. tk_xxxxx"/>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Only required for protected topics or self-hosted instances with auth.</p>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <Separator className="my-1"/>

            <FormField
                control={form.control}
                name="config.ntfyUsername"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Basic Auth Username</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. notifier-user"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.ntfyPassword"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Basic Auth Password</FormLabel>
                        <FormControl>
                            <PasswordInput placeholder="e.g. notifier-password" {...field} />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        </>
    )
}
