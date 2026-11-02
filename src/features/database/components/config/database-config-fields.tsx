"use client";

import { UseFormReturn } from "react-hook-form";
import { EDbmsSchema } from "@/db/schema/types";
import { databaseFieldDefs } from "@/features/database/schemas/database-config.schema";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Props = { dbms: EDbmsSchema; form: UseFormReturn<any>; editing?: boolean };

export const DatabaseConfigFields = ({ dbms, form, editing }: Props) => {
  const formValues = form.watch();
  const visibleFieldDefs = (databaseFieldDefs[dbms] ?? []).filter(
    (fieldDef) => !fieldDef.visibleWhen || fieldDef.visibleWhen(formValues),
  );
  return (
    <div key={dbms} className="flex flex-col gap-4">
      {visibleFieldDefs.map((fieldDef) => (
        <FormField
          key={fieldDef.name}
          control={form.control}
          name={fieldDef.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fieldDef.label}</FormLabel>
              <FormControl>
                {fieldDef.widget === "password" ? (
                  <PasswordInput {...field} value={field.value ?? ""} placeholder={fieldDef.placeholder} />
                ) : fieldDef.widget === "switch" ? (
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                ) : fieldDef.widget === "select" ? (
                  <div className="flex items-center gap-2">
                    <Select value={field.value ?? ""} onValueChange={field.onChange} disabled={!!editing && !!fieldDef.lockedOnEdit}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select…" />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldDef.options?.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldDef.clearable && field.value ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        aria-label={`Clear ${fieldDef.label}`}
                        onClick={() => field.onChange(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                ) : fieldDef.widget === "lines" ? (
                  <Textarea
                    rows={4}
                    placeholder={fieldDef.placeholder}
                    value={Array.isArray(field.value) ? field.value.join("\n") : ""}
                    onChange={(event) => field.onChange(event.target.value.split("\n"))}
                  />
                ) : (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type={fieldDef.widget === "number" ? "number" : "text"}
                    placeholder={fieldDef.placeholder}
                  />
                )}
              </FormControl>
              {fieldDef.description ? <FormDescription>{fieldDef.description}</FormDescription> : null}
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
};
