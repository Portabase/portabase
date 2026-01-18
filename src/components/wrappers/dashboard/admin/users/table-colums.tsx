import {ColumnDef} from "@tanstack/react-table";
import {User} from "@/db/schema/02_user";
import {Badge} from "@/components/ui/badge";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {formatLocalizedDate, timeAgo} from "@/utils/date-formatting";
import {Tooltip, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {TooltipContent} from "@radix-ui/react-tooltip";
import {Info} from "lucide-react";
import {Table, TableBody, TableCell, TableRow} from "@/components/ui/table";
import {UserActionsCell} from "@/components/wrappers/dashboard/admin/users/user-actions-cell";

export function usersListColumns(): ColumnDef<User>[] {

    return [
        {
            accessorKey: "name",
            header: "Profile",
            cell: ({row}) => {

                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="flex flex-row items-center gap-x-2">
                                    <Avatar>
                                        <AvatarImage src={row.original.image ?? ""} alt={row.original.name}/>
                                        <AvatarFallback>
                                            {row.original.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-row items-center gap-x-2">
                                        <div className="font-medium">{row.original.name}</div>
                                        <Info size={16} aria-hidden="true" className="text-muted-foreground"/>
                                    </div>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-background shadow-lg border border-border z-20 rounded-md"
                                            side="bottom">
                                <Table>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell>Joined</TableCell>
                                            <TableCell
                                                className="text-right text-muted-foreground">{formatLocalizedDate(row.original.createdAt)}</TableCell>
                                        </TableRow>
                                        {row.original.lastConnectedAt && (
                                            <TableRow>
                                                <TableCell>Last connected</TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {formatLocalizedDate(row.original.lastConnectedAt)} ({timeAgo(row.original.lastConnectedAt)})
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {row.original.lastChangedPasswordAt && (
                                            <TableRow>
                                                <TableCell>Last password change</TableCell>
                                                <TableCell className="text-right text-muted-foreground">
                                                    {formatLocalizedDate(row.original.lastChangedPasswordAt)} ({timeAgo(row.original.lastChangedPasswordAt)})
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            },
        },
        {
            accessorKey: "email",
            header: "Email",
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({row}) => {
                const role = row.original.role!;
                return <Badge>{role}</Badge>;
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({row}) => <UserActionsCell user={row.original}/>,
        },
    ];
}
