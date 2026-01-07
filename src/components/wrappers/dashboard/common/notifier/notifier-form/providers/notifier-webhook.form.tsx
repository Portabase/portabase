import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";


type NotifierWebhookFormProps = {
    form: UseFormReturn<any, any, any>
}

export const NotifierWebhookForm = ({form}: NotifierWebhookFormProps) => {
    return (
        <>
            <Separator className="my-1"/>
            <FormField
                control={form.control}
                name="config.webhookUrl"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://example.com/api/webhook"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <div className="flex gap-4">
                <div className="flex-1">
                    <FormField
                        control={form.control}
                        name="config.webhookSecretHeader"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Header Name (Optional)</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="X-Webhook-Secret"/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex-1">
                    <FormField
                        control={form.control}
                        name="config.webhookSecret"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Secret Value (Optional)</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="Secret value..."/>
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
                If provided, the secret will be sent in the specified header (defaults to <code>X-Webhook-Secret</code>).
            </p>
        </>
    )
}