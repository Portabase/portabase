
import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";


type NotifierSmtpFormProps = {
    form: UseFormReturn<any, any, any>
}

export const NotifierSlackForm = ({form}: NotifierSmtpFormProps) => {
    return(
        <>
            <Separator className="my-1"/>
            <FormField
                control={form.control}
                name="config.slackWebhook"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Slack Webhook URL</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://hooks.slack.com/services/..."/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        </>
    )
}