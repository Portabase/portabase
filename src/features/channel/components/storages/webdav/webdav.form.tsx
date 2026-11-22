"use client";

import {Plus, Trash2} from "lucide-react";
import {type UseFormReturn, useFieldArray} from "react-hook-form";

import {Button} from "@/components/ui/button";
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Separator} from "@/components/ui/separator";

type StorageWebDavFormProps = {
    form: UseFormReturn;
};

export const StorageWebDavForm = ({form}: StorageWebDavFormProps) => {
    const {fields, append, remove} = useFieldArray({control: form.control, name: "config.headers"});

    return (
        <>
            <Separator className="my-1"/>
            <FormField control={form.control} name="config.url" render={({field}) => (
                <FormItem>
                    <FormLabel>WebDAV URL *</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="https://dav.example.com/remote.php/dav/files/user"/></FormControl>
                    <FormMessage/>
                </FormItem>
            )}/>
            <FormField control={form.control} name="config.username" render={({field}) => (
                <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} autoComplete="username"/></FormControl>
                    <FormMessage/>
                </FormItem>
            )}/>
            <FormField control={form.control} name="config.password" render={({field}) => (
                <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input {...field} type="password" value={field.value ?? ""} autoComplete="new-password"/></FormControl>
                    <FormMessage/>
                </FormItem>
            )}/>
            <FormField control={form.control} name="config.bearerToken" render={({field}) => (
                <FormItem>
                    <FormLabel>Bearer token</FormLabel>
                    <FormControl><Input {...field} type="password" value={field.value ?? ""} autoComplete="new-password"/></FormControl>
                    <p className="text-muted-foreground text-xs">Use Basic authentication or a bearer token, not both.</p>
                    <FormMessage/>
                </FormItem>
            )}/>
            <FormField control={form.control} name="config.remotePath" render={({field}) => (
                <FormItem>
                    <FormLabel>Remote path</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="e.g. backups"/></FormControl>
                    <p className="text-muted-foreground text-xs">Optional prefix below the WebDAV URL.</p>
                    <FormMessage/>
                </FormItem>
            )}/>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Custom Headers</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({key: "", value: ""})}>
                        <Plus className="mr-2 h-4 w-4"/>Add Header
                    </Button>
                </div>
                {fields.length === 0 && (
                    <p className="text-muted-foreground text-xs">No custom headers. Added headers are sent with every WebDAV request.</p>
                )}
                <div className="space-y-2">
                    {fields.map((headerField, index) => (
                        <div key={headerField.id} className="flex gap-2">
                            <div className="flex-1">
                                <FormField control={form.control} name={`config.headers.${index}.key`} render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Header Name</FormLabel>
                                        <FormControl><Input {...field} value={field.value ?? ""} placeholder="e.g. X-Api-Key"/></FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}/>
                            </div>
                            <div className="flex-1">
                                <FormField control={form.control} name={`config.headers.${index}.value`} render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Header Value</FormLabel>
                                        <FormControl><Input {...field} value={field.value ?? ""} placeholder="Header value"/></FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}/>
                            </div>
                            <div className="self-end">
                                <Button type="button" variant="outline" size="icon" aria-label="Remove header" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};
