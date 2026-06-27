import { UseFormReturn } from "react-hook-form";
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
type StorageBlobFormProps = {
  form: UseFormReturn<any, any, any>;
};

export const StorageBlobForm = ({ form }: StorageBlobFormProps) => {
  return (
    <>
      <Separator className="my-1" />
      <FormField
        control={form.control}
        name="config.accountName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. mystorageaccount" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.accountKey"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account Key</FormLabel>
            <FormControl>
              <PasswordInput {...field} placeholder="e.g. base64-encoded-key" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.connectionString"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Connection String</FormLabel>
            <FormControl>
              <PasswordInput {...field} placeholder="e.g. DefaultEndpointsProtocol=https;..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.containerName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Container Name *</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. backups-prod" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.endpointUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Endpoint URL</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g. https://myaccount.blob.core.windows.net" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
