import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";


type NotifierGotifyFormProps = {
    form: UseFormReturn<any, any, any>
}

export const NotifierGotifyForm = ({form}: NotifierGotifyFormProps) => {
    return (
        <>
            <Separator className="my-1"/>
            <FormField
                control={form.control}
                name="config.gotifyServerUrl"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Gotify Server URL</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="https://gotify.example.com"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.gotifyAppToken"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Application Token</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="A1b2C3d4E5f6G7h"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        </>
    )
}
