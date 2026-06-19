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

type NotifierTeamsFormProps = {
  form: UseFormReturn<any, any, any>;
};

export const NotifierTeamsForm = ({ form }: NotifierTeamsFormProps) => {
  return (
    <>
      <Separator className="my-1" />
      <FormField
        control={form.control}
        name="config.teamsWebhook"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Teams Webhook URL *</FormLabel>
            <FormControl>
              <PasswordInput
                {...field}
                placeholder="e.g. https://xxxxx.logic.azure.com:443/xxxxx"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
