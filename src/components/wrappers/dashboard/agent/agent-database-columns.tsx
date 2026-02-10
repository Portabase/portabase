"use client"

import {ColumnDef} from "@tanstack/react-table"
import {Database} from "@/db/schema/07_database"
import Image from "next/image"
import {ConnectionIndicator} from "@/components/wrappers/common/connection-indicator"
import {formatDateLastContact} from "@/utils/date-formatting"
import Link from "next/link"
import {Button} from "@/components/ui/button"
import {ChevronRight} from "lucide-react"

export const agentDatabaseColumns: ColumnDef<Database>[] = [
    {
        accessorKey: "dbms",
        header: "Type",
        cell: ({row}) => (
            <div className="flex items-center justify-center w-8 h-8 p-1.5 bg-muted/50 rounded-lg border border-border/50">
                <Image
                    src={`/images/${row.original.dbms}.png`}
                    alt={row.original.dbms}
                    width={20}
                    height={20}
                    className="object-contain"
                />
            </div>
        )
    },
    {
        accessorKey: "name",
        header: "Name",
        cell: ({row}) => (
            <div className="flex flex-col">
                <span className="font-bold text-sm">{row.original.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                    {row.original.agentDatabaseId}
                </span>
            </div>
        )
    },
    {
        accessorKey: "lastContact",
        header: "Last Contact",
        cell: ({row}) => (
            <div className="flex flex-col">
                <span className="text-xs">
                    {formatDateLastContact(row.original.lastContact)}
                </span>
            </div>
        )
    },
    {
        id: "status",
        header: "Status",
        cell: ({row}) => (
            <div className="flex justify-center w-full">
                <ConnectionIndicator date={row.original.lastContact} />
            </div>
        )
    },
    {
        id: "actions",
        header: () => null,
        cell: ({row}) => {
             const href = row.original.projectId 
                ? `/dashboard/projects/${row.original.projectId}/database/${row.original.id}`
                : "#";
                
             return (
                 <div className="flex justify-end">
                    <Button variant="ghost" size="icon" asChild className="hover:bg-accent group">
                        <Link href={href}>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </Button>
                 </div>
             )
        }
    }
]
