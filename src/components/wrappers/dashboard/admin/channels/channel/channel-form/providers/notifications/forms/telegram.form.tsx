import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";


type NotifierTelegramFormProps = {
    form: UseFormReturn<any, any, any>
}

export const NotifierTelegramForm = ({form}: NotifierTelegramFormProps) => {
    return (
        <>
            <Separator className="my-1"/>
            <FormField
                control={form.control}
                name="config.telegramBotToken"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Telegram Bot Token</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.telegramChatId"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Telegram Chat ID</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="-100123456789 or 123456789"/>
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            You must start the conversation with the bot first (<strong>/start</strong>). <br/>
                            For groups, add the bot to the group. <br/>
                            You can use <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline">@userinfobot</a> to find your ID.
                        </p>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        </>
    )
}
