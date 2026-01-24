import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";

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
                        <FormLabel>Topic Name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="my-secret-topic"/>
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
                        <FormLabel>Server URL (Optional)</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://ntfy.sh (default)"/>
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
                        <FormLabel>Access Token (Optional)</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="tk_..."/>
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
                        <FormLabel>Basic Auth Username (Optional)</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="username"/>
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
                        <FormLabel>Basic Auth Password (Optional)</FormLabel>
                        <FormControl>
                            <Input {...field} type="password" placeholder="password"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        </>
    )
}
