"use client"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    ColumnFiltersState,
    getFilteredRowModel,
} from "@tanstack/react-table";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Input} from "@/components/ui/input";

import {ReactNode, useMemo, useState} from "react";
import {TablePagination} from "./table-pagination";
import {Checkbox} from "@/components/ui/checkbox";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    enableFilter?: boolean;
    enableSelect?: boolean;
    enablePagination?: boolean;
    paginationOptions?: {
        pageSize: number[];
        pageVisible: number;
        className?: string;
    };
    filterOptions?: {
        title?: string;
        key: string;
    };
    emptyButton?: {
        text: string;
        variant: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
        path: string;
    };
    highlightRow?: (row: TData) => boolean;
    selectedActions?: (rows: TData[]) => ReactNode;

}

export function DataTable<TData, TValue>({
                                             columns,
                                             data,
                                             enableFilter = false,
                                             enablePagination = true,
                                             enableSelect = true,
                                             paginationOptions = {pageSize: [10, 20, 30, 40, 50, 100], pageVisible: 3},
                                             filterOptions = {key: "id", title: "Filter by ID"},
                                             emptyButton,
                                             highlightRow,
                                             selectedActions,


                                         }: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});

    const finalColumns = useMemo(() => {
        const selectColumnExists = columns.some((column) => column.id === "select");
        if (enableSelect && data.length > 0 && !selectColumnExists) {
            return [
                {
                    id: "select",
                    header: ({table}: {table: any}) => (
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                        />
                    ),
                    cell: ({row}: {row: any}) => (
                        <Checkbox
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                            aria-label="Select row"
                        />
                    ),
                    enableSorting: false,
                    enableHiding: false,
                },
                ...columns,
            ];
        }
        return columns;
    }, [columns, enableSelect, data.length]);

    const table = useReactTable({
        data,
        columns: finalColumns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onRowSelectionChange: setRowSelection,
        getRowId: (row: any) => row.id || row.uuid,
        autoResetPageIndex: false,
        autoResetExpanded: false,
        enableRowSelection: true,
        state: {
            sorting,
            columnFilters,
            rowSelection,
        },
    });
    const router = useRouter();
    return (
        <div
            className="flex flex-col h-full"
        >
            {enableFilter || selectedActions  && (
                <div className="flex items-center py-4">
                    {enableFilter && (
                        <Input
                            placeholder={`${filterOptions.title ?? `Filter by ${filterOptions.key}`}`}
                            value={(table.getColumn(filterOptions.key)?.getFilterValue() as string) ?? ""}
                            onChange={(event) => table.getColumn(filterOptions.key)?.setFilterValue(event.target.value)}
                            className="max-w-sm"
                        />
                    )}
                    {/*{selectedActions && table.getSelectedRowModel().rows.length > 0 && (*/}
                    {selectedActions && (
                        selectedActions(table.getSelectedRowModel().rows.map(row => row.original))
                    )}
                </div>
            )}
            <div className="flex flex-col justify-between h-full">
                <div className="rounded-md border w-full">
                    <Table className="w-full">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}

                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow key={row.id}
                                              className={highlightRow && highlightRow(row.original) ? "bg-gray-100 pointer-events-none" : ""}
                                              data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="p-0">
                                        {emptyButton ? (
                                            <Button
                                                variant={emptyButton.variant}
                                                className="btn btn-primary cursor-pointer w-full rounded-tr-none rounded-tl-none py-12 text-lg font-bold"
                                                onClick={() => {
                                                    router.push(emptyButton.path)
                                                }}
                                            >
                                                <span>{emptyButton.text}</span>
                                            </Button>
                                        ) : (
                                            <div className="flex items-center justify-center py-12 text-lg font-bold">
                                                <span className="text-lg font-bold">No data available</span>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4 mt-6">
                    {enableSelect && table.getFilteredRowModel().rows.length >= 1 && (
                        <div className="flex-1 text-sm text-muted-foreground">
                            {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s)
                            selected.
                        </div>
                    )}
                    {enablePagination && table.getFilteredRowModel().rows.length >= 1 && (
                        <TablePagination
                            table={table}
                            maxVisiblePages={paginationOptions?.pageVisible}
                            pageSizeOptions={(() => {
                                const rowCount = table.getFilteredRowModel().rows.length;
                                const allSizes = paginationOptions.pageSize.sort((a, b) => a - b);
                                const validSizes = allSizes.filter((size) => size <= rowCount);
                                const nextSize = allSizes.find((size) => size > rowCount);
                                if (nextSize) validSizes.push(nextSize);
                                return validSizes;
                            })()}
                            className={paginationOptions.className}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

