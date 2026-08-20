"use client";

import {ReactNode, useEffect, useMemo, useState} from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
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
  agentConfigSignature,
  UUID_RE,
} from "@/features/database/schemas/database-config.schema";
import { DatabaseConfigFields } from "@/features/database/components/config/database-config-fields";
import { upsertDatabaseConfigAction } from "@/features/database/actions/database-config.action";
import { DB_SECRET_FIELDS } from "@/features/database/utils/credential-fields";

type Props = { agentId: string; database?: Database; trigger: ReactNode };

export const DatabaseConfigModal = ({ agentId, database, trigger }: Props) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"form" | "json">("form");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

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
  const lockedDbms = database?.dbms;

  const initialSignature = useMemo(
    () => agentConfigSignature(initial.form, initial.generatedId),
    [initial],
  );

  useEffect(() => {
    if (tab === "form") {
      setJsonText(JSON.stringify(toAgentConfigJson(watched, generatedId), null, 2));
      setJsonError(null);
    }
  }, [JSON.stringify(watched), generatedId, tab]);

  const onJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      const { form: mapped, generatedId: gid } = fromAgentConfigJson(parsed);
      if (lockedDbms && mapped.dbms !== lockedDbms) {
        setJsonError(`"type" cannot be changed after creation (expected "${lockedDbms}")`);
        return;
      }
      // @ts-expect-error — reset target is a union across discriminated dbms variants
      form.reset(mapped, { keepDefaultValues: true });
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
    form.reset(
      // @ts-expect-error — reset target is a union across discriminated dbms variants
      { name: form.getValues("name"), dbms: value, config: defaultConfigFor(value) },
      { keepDefaultValues: true },
    );
    setGeneratedId(database?.agentDatabaseId ?? undefined);
    setJsonError(null);
  };

  const resetAll = () => {
    // @ts-expect-error — reset target is a union across discriminated dbms variants
    form.reset(initial.form);
    setGeneratedId(initial.generatedId);
    setTab("form");
    setJsonError(null);
  };

  const mutation = useMutation({
    mutationFn: async (values: DatabaseConfigFormType) => {
      const result = await upsertDatabaseConfigAction({
        agentId,
        databaseId: database?.id,
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

  const isDirty =
    agentConfigSignature(watched, generatedId) !== initialSignature;
  const canSubmit = isDirty && !jsonError && !mutation.isPending;

  const isFromFile = !!database && database.config == null;
  const isOverriding = !!database && database.config != null;
  const hasStoredSecret =
    !!database && (DB_SECRET_FIELDS[database.dbms]?.length ?? 0) > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        resetAll();
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

        {isFromFile && (
          <Alert>
            <Info />
            <AlertTitle>Defined in the agent's databases.json</AlertTitle>
            <AlertDescription>
              Saving a configuration here will override it - the agent will use these dashboard
              values instead of its local file.
            </AlertDescription>
          </Alert>
        )}

        {isOverriding && (
          <Alert>
            <Info />
            <AlertTitle>Dashboard configuration active</AlertTitle>
            <AlertDescription>
              These values take precedence over any matching databases.json entry on the agent.
            </AlertDescription>
          </Alert>
        )}

        {hasStoredSecret && (
          <p className="text-xs text-muted-foreground">
            The password is masked. Leave it unchanged to keep the current one; type a new value to replace it.
          </p>
        )}

        <Form
            form={form} className="flex flex-col gap-4" onSubmit={async (v) => {
          await mutation.mutateAsync(v);
        }}>
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
                    <Select
                      value={field.value}
                      onValueChange={(v) => onDbmsChange(v as EDbmsSchema)}
                      disabled={!!lockedDbms}
                    >
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
                    {lockedDbms && (
                      <p className="text-xs text-muted-foreground">
                        The type cannot be changed after creation.
                      </p>
                    )}
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
                spellCheck={false}
              />
              {jsonError && <p className="text-destructive text-xs mt-1">Invalid JSON: {jsonError}</p>}
            </TabsContent>
          </Tabs>

          <ButtonWithLoading isPending={mutation.isPending} disabled={!canSubmit}>
            {database ? "Save" : "Create"}
          </ButtonWithLoading>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
