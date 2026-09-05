"use client";

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
import { Switch } from "@/components/ui/switch";

type NotifierHealthchecksFormProps = {
    form: UseFormReturn<any, any, any>;
};

export const NotifierHealthchecksForm = ({ form }: NotifierHealthchecksFormProps) => {
    const useDatabaseNameAsSlug = form.watch("config.useDatabaseNameAsSlug");

    return (
        <>
            <Separator className="my-1" />

            <FormField
                control={form.control}
                name="config.baseUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ping Server URL *</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                value={field.value ?? "https://hc-ping.com"}
                                placeholder="e.g. https://hc-ping.com"
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            Leave as is for healthchecks.io, or point it at your self-hosted instance.
                        </p>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.pingKey"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Check UUID or Ping Key *</FormLabel>
                        <FormControl>
                            <Input
                                {...field}
                                placeholder="e.g. c43efe18-fb89-4975-980e-caf112eab475"
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            A check UUID pings that single check. A project ping key needs a slug below.
                        </p>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="config.useDatabaseNameAsSlug"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Use database name as slug</FormLabel>
                        <FormControl>
                            <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            One channel for every database: the slug is derived from the database name
                            of each event. Requires a project ping key, not a check UUID.
                        </p>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {!useDatabaseNameAsSlug && (
                <FormField
                    control={form.control}
                    name="config.slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug</FormLabel>
                            <FormControl>
                                <Input
                                    {...field}
                                    value={field.value ?? ""}
                                    placeholder="e.g. my-first-check"
                                />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                                Leave empty when the field above holds a check UUID.
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}

            <FormField
                control={form.control}
                name="config.autoCreate"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Create missing checks</FormLabel>
                        <FormControl>
                            <Switch
                                checked={field.value ?? false}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                            Adds ?create=1 so a slug with no matching check is created on first ping.
                            Ignored when pinging a check UUID.
                        </p>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </>
    );
};
