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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type StorageBlobFormProps = {
  form: UseFormReturn<any, any, any>;
};

export const StorageBlobForm = ({ form }: StorageBlobFormProps) => {
  const storedMode = form.watch("config.authMode");
  // Derive mode for legacy records saved before authMode existed: if no
  // connection string but account credentials are present, open Account Details.
  const derivedMode: "connectionString" | "accountKey" =
    !form.watch("config.connectionString") &&
    (form.watch("config.accountName") || form.watch("config.accountKey"))
      ? "accountKey"
      : "connectionString";
  const authMode: "connectionString" | "accountKey" = storedMode ?? derivedMode;

  const handleModeChange = (value: string) => {
    form.setValue("config.authMode", value, { shouldValidate: false });
    // Clear errors of the now-inactive mode so stale messages don't linger.
    if (value === "connectionString") {
      form.clearErrors(["config.accountName", "config.accountKey"]);
    } else {
      form.clearErrors(["config.connectionString"]);
    }
  };

  return (
    <>
      <Separator className="my-1" />
      <Tabs value={authMode} onValueChange={handleModeChange} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="connectionString">Connection String</TabsTrigger>
          <TabsTrigger value="accountKey">Account Details</TabsTrigger>
        </TabsList>

        <TabsContent value="connectionString" className="flex flex-col gap-3">
          <FormField
            control={form.control}
            name="config.connectionString"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Connection String *</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. DefaultEndpointsProtocol=https;..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>

        <TabsContent value="accountKey" className="flex flex-col gap-3">
          <FormField
            control={form.control}
            name="config.accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Name *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. mystorageaccount"
                  />
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
                <FormLabel>Account Key *</FormLabel>
                <FormControl>
                  <PasswordInput
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. base64-encoded-key"
                  />
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
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. https://myaccount.blob.core.windows.net"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </TabsContent>
      </Tabs>

      <FormField
        control={form.control}
        name="config.containerName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Container Name *</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="e.g. backups-prod"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
