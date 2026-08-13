"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
  DatabaseConfigFormSchema,
  DatabaseConfigFormType,
  databaseTypeOptions,
  defaultConfigFor,
  toAgentConfigJson,
  fromAgentConfigJson,
  UUID_RE,
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
  const [jsonFocused, setJsonFocused] = useState(false);

  // Initial form + generated_id, recomputed if the edited database changes.
  const initial = useMemo(
    () =>
      database
        ? {
            form: {
              name: database.name,
              dbms: database.dbms,
              config: (database.config as Record<string, unknown>) ?? {},
            },
            generatedId: database.agentDatabaseId ?? undefined,
          }
        : {
            form: { name: "", dbms: "postgresql" as EDbmsSchema, config: defaultConfigFor("postgresql") },
            generatedId: undefined as string | undefined,
          },
    [database],
  );

  const [generatedId, setGeneratedId] = useState<string | undefined>(initial.generatedId);

  const form = useZodForm({
    schema: DatabaseConfigFormSchema,
    defaultValues: initial.form,
  });

  const dbms = form.watch("dbms") as EDbmsSchema;
  const watched = form.watch();

  // Form -> JSON: live-refresh the agent-shaped textarea from the form (name,
  // type and every connection field) UNLESS the user is actively editing the
  // JSON, so in-progress edits are never clobbered.
  useEffect(() => {
    if (!jsonFocused) {
      setJsonText(JSON.stringify(toAgentConfigJson(watched, generatedId), null, 2));
      setJsonError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watched), generatedId, jsonFocused]);

  // JSON -> Form: parse the flat agent config; on success map it back into the
  // form (and pull out generated_id); on failure show an inline error.
  const onJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      const { form: mapped, generatedId: gid } = fromAgentConfigJson(parsed);
      // @ts-expect-error — reset target is a union across discriminated dbms variants
      form.reset(mapped);
      if (gid && !UUID_RE.test(gid)) {
        setGeneratedId(undefined);
        setJsonError("generated_id must be a valid UUID");
      } else {
        setGeneratedId(gid);
        setJsonError(null);
      }
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const onDbmsChange = (value: EDbmsSchema) => {
    // Switching type wipes the previous type's connection fields (keep only the
    // user-entered name) and drops any pasted generated_id / json error.
    // @ts-expect-error — reset target is a union across discriminated dbms variants
    form.reset({ name: form.getValues("name"), dbms: value, config: defaultConfigFor(value) });
    setGeneratedId(database?.agentDatabaseId ?? undefined);
    setJsonError(null);
  };

  const resetAll = () => {
    // @ts-expect-error — reset target is a union across discriminated dbms variants
    form.reset(initial.form);
    setGeneratedId(initial.generatedId);
    setTab("form");
    setJsonError(null);
    setJsonFocused(false);
  };

  const mutation = useMutation({
    mutationFn: async (values: DatabaseConfigFormType) => {
      const result = await upsertDatabaseConfigAction({
        agentId,
        databaseId: database?.id,
        // Only meaningful on create; ignored by the update branch.
        agentDatabaseId: database ? undefined : generatedId,
        data: values,
      });
      if (result?.serverError) {
        toast.error(result.serverError);
        return;
      }
      if (result?.validationErrors) {
        toast.error("Invalid configuration");
        return;
      }
      toast.success(database ? "Database updated" : "Database created");
      setOpen(false);
      router.refresh();
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetAll();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{database ? "Configure database" : "Add database"}</DialogTitle>
          <DialogDescription>
            Define the connection settings pushed to the agent on status.
          </DialogDescription>
        </DialogHeader>

        <Form form={form} className="flex flex-col gap-4" onSubmit={async (v) => { await mutation.mutateAsync(v); }}>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "form" | "json")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="form">Form</TabsTrigger>
              <TabsTrigger value="json">JSON</TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="flex flex-col gap-4 pt-2">
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
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {databaseTypeOptions.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            <span className="flex items-center gap-2">
                              <Image
                                src={`/images/${o.value}.png`}
                                alt=""
                                width={16}
                                height={16}
                                className="object-contain shrink-0"
                              />
                              {o.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DatabaseConfigFields dbms={dbms} form={form} />
            </TabsContent>

            <TabsContent value="json" className="pt-2">
              <p className="text-xs text-muted-foreground mb-2">
                Paste an agent config entry (the same shape as <code>databases.json</code>).
              </p>
              <Textarea
                className="font-mono text-xs min-h-64"
                value={jsonText}
                onChange={(e) => onJsonChange(e.target.value)}
                onFocus={() => setJsonFocused(true)}
                onBlur={() => setJsonFocused(false)}
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
