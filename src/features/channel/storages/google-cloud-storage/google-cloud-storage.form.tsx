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
import { Textarea } from "@/components/ui/textarea";

type StorageGoogleCloudStorageFormProps = {
  form: UseFormReturn<any, any, any>;
};

export const StorageGoogleCloudStorageForm = ({
  form,
}: StorageGoogleCloudStorageFormProps) => {
  return (
    <>
      <Separator className="my-1" />
      <FormField
        control={form.control}
        name="config.projectId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Project ID *</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} placeholder="e.g. my-gcp-project" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.bucketName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bucket name *</FormLabel>
            <FormControl>
              <Input {...field} value={field.value ?? ""} placeholder="e.g. backups-prod" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.clientEmail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Client email *</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ""}
                placeholder="e.g. service-account@my-gcp-project.iam.gserviceaccount.com"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="config.privateKey"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Private key *</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                rows={5}
                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
