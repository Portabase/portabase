"use client"
import {ColumnDef} from "@tanstack/react-table";
import {Organization} from "@/db/schema/03_organization";

export const organizationsColumnsAdmin: ColumnDef<Organization>[] = [

    {
        accessorKey: "name",
        header: "Name",
    },

    // {
    //     header: "Action",
    //     id: "actions",
    //     cell: ({row}) => {
    //         const router = useRouter();
    //         const {data: session, isPending} = useSession();
    //         const isSuperAdmin = session?.user.role == "superadmin";
    //
    //         return (
    //             <ButtonDeleteUser
    //                 disabled={!isSuperAdmin || !session || session?.user.email === row.original.email}
    //                 userId={row.original.id}/>
    //         );
    //     },
    // },
];
