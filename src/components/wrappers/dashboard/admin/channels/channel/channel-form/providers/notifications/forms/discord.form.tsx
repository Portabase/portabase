import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { PasswordInput } from "@/components/ui/password-input";

type NotifierDiscordFormProps = {
  form: UseFormReturn<any, any, any>;
};

export const NotifierDiscordForm = ({ form }: NotifierDiscordFormProps) => {
  return (
    <>
      <Separator className="my-1" />
      <FormField
        control={form.control}
        name="config.discordWebhook"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Discord Webhook URL</FormLabel>
            <FormControl>
              <PasswordInput
                {...field}
                placeholder="https://discord.com/api/webhooks/..."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
