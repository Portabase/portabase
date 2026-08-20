import { Button } from "@/components/ui/button";
import { RowData } from "@tanstack/react-table";
import type { AppColumn as Column } from "@/components/common/table-features";
import { ArrowDown, ArrowUp } from "lucide-react";

interface tableSortButtonProps<TData extends RowData, TValue> {
    title?: string;
    defaultOrder: "asc" | "desc";
    column: Column<TData, TValue>;
}

export default function TableSortButton<TData extends RowData, TValue>(props: tableSortButtonProps<TData, TValue>) {
    return (
        <Button variant="ghost" onClick={() => props.column.toggleSorting(props.column.getIsSorted() === "asc")}>
            {props.title ?? "Please define a title"}
            {props.column.getIsSorted() === props.defaultOrder ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />}
        </Button>
    );
}
