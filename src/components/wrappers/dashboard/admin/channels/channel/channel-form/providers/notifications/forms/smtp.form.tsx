import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {UseFormReturn} from "react-hook-form";
import {Separator} from "@/components/ui/separator";
import {PasswordInput} from "@/components/ui/password-input";


type NotifierSmtpFormProps = {
    form: UseFormReturn<any, any, any>
}


export const NotifierSmtpForm = ({form}: NotifierSmtpFormProps) => {
    return (
        <>
            <Separator className="my-1"/>
            <FormField
                control={form.control}
                name="config.host"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>SMTP Host</FormLabel>
                        <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} value={field.value ?? ""}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.port"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>SMTP Port</FormLabel>
                        <FormControl>
                            <Input placeholder="456" type="number" {...field} value={field.value ?? ""}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.user"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                            <Input placeholder="contact@exemple.com" {...field} value={field.value ?? ""}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.password"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <PasswordInput
                                {...field}
                                value={field.value ?? ""}
                            />
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.from"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>From Email</FormLabel>
                        <FormControl>
                            <Input placeholder={`"Portabase" <exemple@portabase.io>`} {...field}
                                   value={field.value ?? ""}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.to"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>To Email</FormLabel>
                        <FormControl>
                            <Input placeholder={"contact@portabase.io, contact2@portabase.io"} {...field}
                                   value={field.value ?? ""}/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />

        </>
    )
}