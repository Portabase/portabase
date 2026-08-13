"use client";

import { UseFormReturn } from "react-hook-form";
import { EDbmsSchema } from "@/db/schema/types";
import { databaseFieldDefs } from "@/features/database/schemas/database-config.schema";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = { dbms: EDbmsSchema; form: UseFormReturn<any> };

export const DatabaseConfigFields = ({ dbms, form }: Props) => {
  const defs = databaseFieldDefs[dbms] ?? [];
  return (
    <div className="flex flex-col gap-4">
      {defs.map((def) => (
        <FormField
          key={def.name}
          control={form.control}
          name={def.name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{def.label}</FormLabel>
              <FormControl>
                {def.widget === "password" ? (
                  <PasswordInput {...field} value={field.value ?? ""} placeholder={def.placeholder} />
                ) : def.widget === "switch" ? (
                  <Switch checked={!!field.value} onCheckedChange={field.onChange} />
                ) : def.widget === "select" ? (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {def.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type={def.widget === "number" ? "number" : "text"}
                    placeholder={def.placeholder}
                  />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
};
