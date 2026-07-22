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

type NotifierAppriseFormProps = {
    form: UseFormReturn<any, any, any>;
};

export const NotifierAppriseForm = ({ form }: NotifierAppriseFormProps) => {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "config.appriseHeaders",
    });

    return (
        <>
            <Separator className="my-1" />

            <FormField
                control={form.control}
                name="config.appriseServerUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Apprise Server URL *</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. http://localhost:8000" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            Base URL of your Apprise API server.
                        </p>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.appriseConfigKey"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Config Key *</FormLabel>
                        <FormControl>
                            <Input {...field} placeholder="e.g. my-alerts" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            The persistent config key registered on your Apprise server. Sends to POST /notify/&#123;key&#125;.
                        </p>
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
                        No custom headers. Add headers for servers behind a reverse-proxy or basic auth.
                    </p>
                )}

                <div className="space-y-2">
                    {fields.map((headerField, index) => (
                        <div key={headerField.id} className="flex gap-2">
                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name={`config.appriseHeaders.${index}.key`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Header Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="e.g. Authorization" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex-1">
                                <FormField
                                    control={form.control}
                                    name={`config.appriseHeaders.${index}.value`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Header Value</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Header value" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="self-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => remove(index)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
