"use client";

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    useZodForm,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { AgentSchema } from "@/features/agents/schemas/agents.schema";
import { updateAgentAction } from "@/features/agents/actions/agents.action";
import { getServerUrl } from "@/utils/get-server-url";
import { AgentWithDatabases } from "@/db/schema/08_agent";

const OverrideUrlSchema = z.object({
    overrideUrl: AgentSchema.shape.overrideUrl,
});
type OverrideUrlType = z.infer<typeof OverrideUrlSchema>;

export const AgentOverrideUrlForm = ({ agent }: { agent: AgentWithDatabases }) => {
    const queryClient = useQueryClient();
    const serverUrl = getServerUrl();
    const [open, setOpen] = useState("");

    // Prefill with the dashboard URL so the field always shows the effective value.
    const initialValue = agent.overrideUrl ?? serverUrl;

    const form = useZodForm({
        schema: OverrideUrlSchema,
        defaultValues: { overrideUrl: initialValue },
    });

    const mutation = useMutation({
        mutationFn: async (values: OverrideUrlType) => {
            // A value equal to the dashboard URL (or blank) means "no override" -> store null.
            const overrideUrl =
                values.overrideUrl && values.overrideUrl !== serverUrl
                    ? values.overrideUrl
                    : null;

            const result = await updateAgentAction({
                id: agent.id,
                data: {
                    name: agent.name,
                    description: agent.description,
                    overrideUrl,
                },
            });
            if (result?.serverError || !result?.data?.data) {
                toast.error(result?.serverError ?? "Failed to update server URL");
                return;
            }
            toast.success("Server URL updated");
            // Reset the baseline so the Save button re-disables until the next edit.
            form.reset({ overrideUrl: overrideUrl ?? serverUrl });
            queryClient.invalidateQueries({ queryKey: ["agent-data", agent.id] });
        },
    });

    return (
        <Accordion
            type="single"
            collapsible
            className="w-full"
            value={open}
            onValueChange={(v) => {
                if (!v) form.reset({ overrideUrl: agent.overrideUrl ?? serverUrl });
                setOpen(v);
            }}
        >
            <AccordionItem value="server-url" className="border last:border-b rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline py-3 text-sm font-semibold uppercase tracking-tight text-muted-foreground">
                    Server URL
                </AccordionTrigger>
                <AccordionContent className="pb-4 px-1">
                    <Form
                        form={form}
                        className="flex flex-col gap-3 w-full"
                        onSubmit={async (values) => {
                            await mutation.mutateAsync(values);
                        }}
                    >
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Custom address embedded in the edge key. Defaults to the dashboard
                            URL - change it only to reach this server at a different
                            address (e.g. a local network address).
                        </p>
                        <div className="flex items-start gap-2">
                            <FormField
                                control={form.control}
                                name="overrideUrl"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className="sr-only">Server URL override</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder={serverUrl}
                                                className="font-mono text-xs h-10 w-full"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="submit"
                                className="h-10 px-6 shrink-0"
                                disabled={!form.formState.isDirty || mutation.isPending}
                            >
                                Save
                            </Button>
                        </div>
                    </Form>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};
