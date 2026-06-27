"use client";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useZodForm,
} from "@/components/ui/form";
import {
  RetentionSettings,
  RetentionSettingsSchema,
} from "@/features/database/schemas/retention-policy.schema";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, Save } from "lucide-react";

export type BackupRetentionSettingsFormProps = {
  defaultValues?: RetentionSettings;
  currentType?: string;
  isPending?: boolean;
  onSave: (values: RetentionSettings) => Promise<void>;
};

export const BackupRetentionSettingsForm = ({
  defaultValues,
  currentType,
  isPending = false,
  onSave,
}: BackupRetentionSettingsFormProps) => {
  const form = useZodForm({
    schema: RetentionSettingsSchema,
    defaultValues: defaultValues ?? {
      count: 7,
      days: 30,
      gfs: { daily: 7, weekly: 4, monthly: 12, yearly: 3 },
    },
  });

  const calculateTotalFiles = (values: RetentionSettings) => {
    if (values.type === "gfs" && values.gfs) {
      return (
        (values.gfs.daily ?? 0) +
        (values.gfs.weekly ?? 0) +
        (values.gfs.monthly ?? 0) +
        (values.gfs.yearly ?? 0)
      );
    }
    return values.type === "count"
      ? (values.count ?? 0)
      : values.type === "days"
        ? (values.days ?? 0)
        : 0;
  };

  const getStorageEstimate = (totalFiles: number) => {
    if (totalFiles <= 10) return "Low";
    if (totalFiles <= 30) return "Medium";
    return "High";
  };

  return (
    <div className="flex flex-col gap-3 py-0">
      <div className="px-3">
        <Form
          form={form}
          className="flex flex-col gap-6 mt-0"
          onSubmit={async (values) => {
            await onSave(values);
          }}
        >
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Retention Policy Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    className="grid grid-cols-1 gap-4"
                  >
                    {[
                      {
                        id: "count",
                        label: "Keep last N backups",
                        desc: "Simple count-based retention (e.g., keep last 10 backups)",
                      },
                      {
                        id: "days",
                        label: "Keep backups for X days",
                        desc: "Time-based retention (e.g., keep backups for 30 days)",
                      },
                      {
                        id: "gfs",
                        label: "GFS Rotation",
                        desc: "Grandfather-Father-Son rotation for enterprise/critical systems",
                        badge: "Recommended",
                      },
                    ].map((opt) => (
                      <FormLabel
                        key={opt.id}
                        htmlFor={opt.id}
                        className={`flex items-center space-x-3 rounded-lg border p-4 transition-colors cursor-pointer ${
                          field.value === opt.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <RadioGroupItem value={opt.id} id={opt.id} />
                        <div className="flex-1">
                          <span className="font-medium flex items-center gap-2">
                            {opt.label}
                            {opt.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {opt.badge}
                              </Badge>
                            )}
                          </span>
                          <p className="text-sm text-muted-foreground">
                            {opt.desc}
                          </p>
                        </div>
                        {currentType === opt.id && (
                          <Badge variant="secondary" className="text-xs">
                            Actual
                          </Badge>
                        )}
                      </FormLabel>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("type") && <Separator />}

          {form.watch("type") === "count" && (
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of backups to keep</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      className="w-32"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Older backups beyond this count will be automatically
                    deleted.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {form.watch("type") === "days" && (
            <FormField
              control={form.control}
              name="days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Retention period (days)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={3650}
                      className="w-32"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormDescription>
                    Backups older than {field.value} days will be automatically
                    deleted.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {form.watch("type") === "gfs" && (
            <div className="space-y-4">
              {[
                { key: "daily" as const, label: "Daily", max: 31 },
                { key: "weekly" as const, label: "Weekly", max: 52 },
                { key: "monthly" as const, label: "Monthly", max: 120 },
                { key: "yearly" as const, label: "Yearly", max: 50 },
              ].map(({ key, label, max }) => (
                <FormField
                  key={key}
                  control={form.control}
                  name={`gfs.${key}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{label} backups</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={max}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.valueAsNumber)
                          }
                        />
                      </FormControl>
                      <FormDescription>Keep N {key} backups</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          )}

          {form.watch("type") && (
            <>
              <Separator />
              <div className="rounded-lg border p-4 space-y-3 bg-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Storage Impact Summary</span>
                  </div>
                  {(() => {
                    const totalFiles = calculateTotalFiles(form.getValues());
                    const estimate = getStorageEstimate(totalFiles);
                    return (
                      <Badge
                        variant={
                          estimate === "Low"
                            ? "default"
                            : estimate === "Medium"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {estimate} Usage
                      </Badge>
                    );
                  })()}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      Estimated files per database:
                    </span>
                    <p className="font-medium">
                      {calculateTotalFiles(form.getValues())} backup files
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Policy type:</span>
                    <p className="font-medium capitalize">
                      {form.watch("type") === "gfs"
                        ? "GFS Rotation"
                        : form.watch("type") === "count"
                          ? "Count-based"
                          : "Time-based"}
                    </p>
                  </div>
                </div>
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isPending ? "Saving Policy..." : "Save Retention Policy"}
              </Button>
            </>
          )}
        </Form>
      </div>
    </div>
  );
};
