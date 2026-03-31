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

type NotifierGotifyFormProps = {
  form: UseFormReturn<any, any, any>;
};

export const NotifierGotifyForm = ({ form }: NotifierGotifyFormProps) => {
  return (
    <>
      <Separator className="my-1" />
      <FormField
        control={form.control}
        name="config.gotifyServerUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gotify Server URL *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. https://gotify.example.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.gotifyAppToken"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Application Token *</FormLabel>
            <FormControl>
              <PasswordInput {...field} placeholder="e.g. gotify-app-token" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
