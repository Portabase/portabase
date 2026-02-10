"use client";

import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    useZodForm
} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Form} from "@/components/ui/form";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {TooltipProvider} from "@/components/ui/tooltip";
import {AgentSchema, AgentType} from "@/features/agents/agents.schema";
import {toast} from "sonner";
import {createAgentAction, updateAgentAction} from "@/features/agents/agents.action";

export type agentFormProps = {
    defaultValues?: AgentType;
    agentId?: string;
    onSuccess?: (data: any) => void;
};

export const AgentForm = (props: agentFormProps) => {
    const isCreate = !Boolean(props.defaultValues);
    const queryClient = useQueryClient();

    const form = useZodForm({
        schema: AgentSchema,
        defaultValues: props.defaultValues,
    });

    const router = useRouter();

    const mutation = useMutation({
        mutationFn: async (values: AgentType) => {

            const createAgent = isCreate
                ? await createAgentAction(values)
                : await updateAgentAction({
                    id: props.agentId ?? "-",
                    data: values,
                });

            const data = createAgent?.data?.data;
            if (createAgent?.serverError || !data) {
                toast.error(createAgent?.serverError);
                return;
            }
            toast.success(`Success ${isCreate ? "creating" : "updating"} agent`);
            
            if (!isCreate && props.agentId) {
                queryClient.invalidateQueries({ queryKey: ["agent-data", props.agentId] });
            }
            
            if (props.onSuccess) {
                props.onSuccess(data);
            } else {
                router.push(`/dashboard/agents/${data.id}`);
            }
        },
    });


    return (
        <TooltipProvider>
            <Form
                form={form}
                className="flex flex-col gap-4"
                onSubmit={async (values) => {
                    await mutation.mutateAsync(values);
                }}
            >
                <FormField
                    control={form.control}
                    name="name"
                    defaultValue=""
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Agent 1" {...field} />
                            </FormControl>
                            <FormDescription>Your agent project name</FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    defaultValue=""
                    name="description"
                    render={({field}) => (
                        <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                                <Input placeholder="This agent is for the client example.com" {...field}
                                       value={field.value ?? ""}/>
                            </FormControl>
                            <FormDescription>Enter your project agent description</FormDescription>
                            <FormMessage/>
                        </FormItem>
                    )}
                />
                <div className="flex justify-end">
                    <Button type="submit">
                        {isCreate ? "Create" : "Update"}
                    </Button>
                </div>
            </Form>

        </TooltipProvider>
    );
};
