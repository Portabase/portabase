import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {useMutation} from "@tanstack/react-query";
import {ColumnDef} from "@tanstack/react-table";
import {Unlink} from "lucide-react";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import {unlinkUserProviderAction} from "@/components/wrappers/dashboard/profile2/user-form/user-form.action";
import {providerSwitch} from "@/components/wrappers/common/provider-switch";
import {Account} from "better-auth";


export const accountsColumns: ColumnDef<Account>[] = [
    {
        id: "provider",
        header: "Provider",
        cell: ({row}) => {
            return (
                <div>
                    {providerSwitch(row.original.providerId)}
                </div>

            )

        },
    },
    {
        header: "Action",
        id: "actions",
        cell: ({row, table}) => {
            const router = useRouter();

            const mutation = useMutation({
                mutationFn: async () => {
                    if (row.original.providerId === "credential") {
                        toast.error(`This provider cannot be unlinked.`);
                        router.refresh();
                        return;
                    }

                    if (table.getRowModel().rows.length <= 1) {
                        toast.error(`You only have one provider linked to your account. Please add more one to unlink this`);
                        router.refresh();
                        return;
                    }

                    const status = await unlinkUserProviderAction({
                        provider: row.original.providerId,
                        account: row.original.accountId,
                    });

                    if (status?.serverError || !status) {
                        toast.error(status?.serverError);
                        return;
                    }
                    toast.success(`Provider unlinked successfully.`);
                    router.refresh();
                },
            });

            return (
                <div className="flex items-center gap-2">
                    <ButtonWithLoading
                        variant="outline"
                        disabled={row.original.providerId === "credential" || table.getRowModel().rows.length <= 1}
                        icon={<Unlink color="red" size={15}/>}
                        onClick={async () => {
                            await mutation.mutateAsync();
                        }}
                        size="icon"
                    />
                </div>
            );
        },
    },
];
