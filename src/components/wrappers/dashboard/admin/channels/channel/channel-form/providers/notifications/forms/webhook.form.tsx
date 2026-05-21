"use client";

import { useFieldArray, UseFormReturn } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type NotifierWebhookFormProps = {
    form: UseFormReturn<any, any, any>;
};

export const NotifierWebhookForm = ({ form }: NotifierWebhookFormProps) => {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "config.webhookHeaders",
    });

    return (
        <>
            <Separator className="my-1" />
            <FormField
                control={form.control}
                name="config.webhookUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Webhook URL *</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="e.g. https://example.com/api/webhook"
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Custom Headers</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ key: "", value: "" })}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Header
                    </Button>
                </div>

                {fields.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                        No custom headers. Add headers to send with each webhook request.
                    </p>
                )}

                <div className="space-y-2">
                    {fields.map((headerField, index) => (
                        <div key={headerField.id} className="flex gap-2">
                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name={`config.webhookHeaders.${index}.key`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="e.g. X-Api-Key"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name={`config.webhookHeaders.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Header value"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
