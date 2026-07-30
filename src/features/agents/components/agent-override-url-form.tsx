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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

    const form = useZodForm({
        schema: OverrideUrlSchema,
        defaultValues: { overrideUrl: agent.overrideUrl ?? "" },
    });

    const mutation = useMutation({
        mutationFn: async (values: OverrideUrlType) => {
            const result = await updateAgentAction({
                id: agent.id,
                data: {
                    name: agent.name,
                    description: agent.description,
                    overrideUrl: values.overrideUrl,
                },
            });
            if (result?.serverError || !result?.data?.data) {
                toast.error(result?.serverError ?? "Failed to update server URL");
                return;
            }
            toast.success("Server URL updated");
            queryClient.invalidateQueries({ queryKey: ["agent-data", agent.id] });
        },
    });

    return (
        <Card className="border-muted/60 shadow-none py-0">
            <CardHeader className="px-4 pt-4">
                <CardTitle className="text-sm font-semibold uppercase tracking-tight">
                    Server URL
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed">
                    Leave empty to use the dashboard URL. Set a custom address
                    (e.g. a local network address) to embed in the edge key.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
                <Form
                    form={form}
                    className="flex items-start gap-2"
                    onSubmit={async (values) => {
                        await mutation.mutateAsync(values);
                    }}
                >
                    <FormField
                        control={form.control}
                        name="overrideUrl"
                        render={({ field }) => (
                            <FormItem className="flex-1">
                                <FormLabel className="sr-only">Server URL override</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder={getServerUrl()}
                                        className="font-mono text-xs h-10"
                                        {...field}
                                        value={field.value ?? ""}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="h-10 px-4" disabled={mutation.isPending}>
                        Save
                    </Button>
                </Form>
            </CardContent>
        </Card>
    );
};
