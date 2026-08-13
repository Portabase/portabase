"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, useZodForm } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ButtonWithLoading } from "@/components/common/button-with-loading";
import { Database } from "@/db/schema/07_database";
import { EDbmsSchema } from "@/db/schema/types";
import {
  DatabaseConfigFormSchema, DatabaseConfigFormType, databaseTypeOptions, defaultConfigFor,
} from "@/features/database/schemas/database-config.schema";
import { DatabaseConfigFields } from "@/features/database/components/config/database-config-fields";
import { upsertDatabaseConfigAction } from "@/features/database/actions/database-config.action";

type Props = { agentId: string; database?: Database; trigger: React.ReactNode };

export const DatabaseConfigModal = ({ agentId, database, trigger }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  const form = useZodForm({
    schema: DatabaseConfigFormSchema,
    defaultValues: database
      ? { name: database.name, dbms: database.dbms, config: (database.config as any) ?? {} }
      : { name: "", dbms: "postgresql", config: defaultConfigFor("postgresql") },
  });

  const dbms = form.watch("dbms") as EDbmsSchema;
  const watched = form.watch();

  // Form -> JSON: refresh textarea from form values while on the Form tab.
  useEffect(() => {
    if (tab === "form") setJsonText(JSON.stringify(watched, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watched), tab]);

  // JSON -> Form: parse on every edit; reset the form on success, show error on failure.
  const onJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      form.reset(parsed);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const onDbmsChange = (value: EDbmsSchema) => {
    // @ts-expect-error — defaultValues type is a union across discriminated dbms variants
    form.reset({ name: form.getValues("name"), dbms: value, config: defaultConfigFor(value) });
  };

  const mutation = useMutation({
    mutationFn: async (values: DatabaseConfigFormType) => {
      const result = await upsertDatabaseConfigAction({
        agentId,
        databaseId: database?.id,
        data: values,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      toast.success(database ? "Database updated" : "Database created");
      setOpen(false);
      router.refresh();
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{database ? "Configure database" : "Add database"}</DialogTitle>
          <DialogDescription>
            Define the connection settings pushed to the agent on status.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} className="flex flex-col gap-4" onSubmit={async (v) => { await mutation.mutateAsync(v); }}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name *</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} placeholder="e.g. Prod PostgreSQL" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dbms"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type *</FormLabel>
                <Select value={field.value} onValueChange={(v) => onDbmsChange(v as EDbmsSchema)}>
                  <FormControl>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {databaseTypeOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Tabs value={tab} onValueChange={(v) => setTab(v as "form" | "json")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Form</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="pt-2">
              <DatabaseConfigFields dbms={dbms} form={form} />
            </TabsContent>

            <TabsContent value="json" className="pt-2">
              <Textarea
                className="font-mono text-xs min-h-64"
                value={jsonText}
                onChange={(e) => onJsonChange(e.target.value)}
                spellCheck={false}
              />
              {jsonError && <p className="text-destructive text-xs mt-1">Invalid JSON: {jsonError}</p>}
            </TabsContent>
          </Tabs>

          <ButtonWithLoading isPending={mutation.isPending}>
            {database ? "Save" : "Create"}
          </ButtonWithLoading>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
