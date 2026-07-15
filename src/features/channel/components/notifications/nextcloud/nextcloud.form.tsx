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
import { PasswordInput } from "@/components/ui/password-input";

type NotifierNextcloudFormProps = {
  form: UseFormReturn<any, any, any>;
};

export const NotifierNextcloudForm = ({ form }: NotifierNextcloudFormProps) => {
  return (
    <>
      <Separator className="my-1" />
      <FormField
        control={form.control}
        name="config.nextcloudUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nextcloud URL *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. https://cloud.example.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.nextcloudBotToken"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bot Token *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. j3yujpuh" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.nextcloudBotSecret"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bot Secret *</FormLabel>
            <FormControl>
              <PasswordInput {...field} placeholder="HMAC signing secret" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
