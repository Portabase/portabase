import {ButtonWithLoading} from "@/components/wrappers/common/button/button-with-loading";
import {useMutation} from "@tanstack/react-query";
import {ColumnDef} from "@tanstack/react-table";
import {Session} from "better-auth";
import {Unlink} from "lucide-react";
import {toast} from "sonner";
import {useRouter} from "next/navigation";
import detectOSWithUA from "@/utils/os-parser";
import {Icon} from "@iconify/react";
import {authClient} from "@/lib/auth/auth-client";
import {timeAgo} from "@/utils/date-formatting";
import {deleteUserSessionAction} from "@/components/wrappers/dashboard/profile2/user-form/user-form.action";

export const sessionsColumns: ColumnDef<Session>[] = [
    {
        accessorKey: "expiresAt",
        header: "Expires At",
        cell: ({row}) => {
            return timeAgo(row.original.expiresAt);
        },
    },
    {
        id: "device",
        header: "Device",
        cell: ({row}) => {
            const os = detectOSWithUA(row.original.userAgent!);

            return (
                <div className="flex flex-row gap-x-2 items-center pt-4 pb-4">
                    {os.icon &&
                        <Icon icon={`logos:${os.icon.name}`} height={os.icon.size.height} width={os.icon.size.width}/>}
                    {os.showText && <span>{os.name}</span>}
                </div>
            );
        },
    },
    {
        accessorKey: "userAgent",
        header: "User Agent",
    },
    {
        header: "Action",
        id: "actions",
        cell: ({row}) => {
            const router = useRouter();

            const {data: session, isPending, error} = authClient.useSession();


            const mutation = useMutation({
                mutationFn: async () => {
                    if (session?.session.id === row.original.id) {
                        toast.error(`Unable to unlink active session.`);
                        router.refresh();
                        return;
                    }

                    const status = await deleteUserSessionAction(row.original.token);

                    if (status?.serverError || !status) {
                        toast.error(status?.serverError);
                        return;
                    }
                    toast.success(`Session deleted successfully.`);
                    router.refresh();
                },
            });


            if (isPending || error) return null;


            return (
                <div className="flex items-center gap-2">
                    <ButtonWithLoading
                        isPending={mutation.isPending}
                        variant="outline"
                        disabled={session?.session.id === row.original.id}
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
