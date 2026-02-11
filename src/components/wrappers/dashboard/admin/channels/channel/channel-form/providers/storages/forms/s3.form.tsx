import {UseFormReturn} from "react-hook-form";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Separator} from "@/components/ui/separator";
import {PasswordInput} from "@/components/ui/password-input";
import {Switch} from "@/components/ui/switch";


type StorageS3FormProps = {
    form: UseFormReturn<any, any, any>
}

export const StorageS3Form = ({form}: StorageS3FormProps) => {
    return (
        <>
            <Separator className="my-1"/>
            <FormField
                control={form.control}
                name="config.endPointUrl"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Endpoint URL</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="s3.amazonaws.com"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.region"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Region</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="us-east-1"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.accessKey"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Access Key</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="A1b2C3d4E5f6G7h"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.secretKey"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Secret Key</FormLabel>
                        <FormControl>
                            <PasswordInput {...field} placeholder="A1b2C3d4E5f6G7h"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.bucketName"
                render={({field}) => (
                    <FormItem>
                        <FormLabel>Bucket name</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="portabase-dev"/>
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="config.port"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Port</FormLabel>
                        <FormControl>
                            <Input {...field} type="number" placeholder="443" />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.ssl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Use SSL</FormLabel>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

        </>
    )
}
