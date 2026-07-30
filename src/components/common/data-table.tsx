"use client"
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    OnChangeFn,
    PaginationState,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { ReactNode, useMemo, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { TablePagination } from "./table-pagination";

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
    toolbar?: ReactNode;
    emptyState?: ReactNode;
    manualPagination?: boolean;
    rowCount?: number;
    paginationState?: PaginationState;
    onPaginationChange?: OnChangeFn<PaginationState>;
    manualSorting?: boolean;
    sorting?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    enableFilter = false,
    enablePagination = true,
    enableSelect = true,
    paginationOptions = { pageSize: [10, 20, 30, 40, 50, 100], pageVisible: 3 },
    filterOptions = { key: "id", title: "Filter by ID" },
    emptyButton,
    highlightRow,
    selectedActions,
    toolbar,
    emptyState,
    manualPagination = false,
    rowCount,
    paginationState,
    onPaginationChange,
    manualSorting = false,
    sorting: controlledSorting,
    onSortingChange: controlledOnSortingChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: paginationOptions.pageSize[0] ?? 10,
    });
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [rowSelection, setRowSelection] = useState({});
    const router = useRouter();

    const currentSorting = controlledSorting ?? sorting;
    const currentPagination = paginationState ?? pagination;
    const handleSortingChange = controlledOnSortingChange ?? setSorting;
    const handlePaginationChange = onPaginationChange ?? setPagination;

    const finalColumns = useMemo(() => {
        const selectColumnExists = columns.some((column) => column.id === "select");
        if (enableSelect && data.length > 0 && !selectColumnExists) {
            return [
                {
                    id: "select",
                    header: ({ table }: { table: any }) => (
                        <Checkbox
                            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            aria-label="Select all"
                        />
                    ),
                    cell: ({ row }: { row: any }) => (
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
        getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
        getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: handleSortingChange,
        onColumnFiltersChange: setColumnFilters,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: handlePaginationChange,
        getRowId: (row: any) => row.id || row.uuid,
        autoResetPageIndex: false,
        autoResetExpanded: false,
        enableRowSelection: enableSelect,
        manualPagination,
        manualSorting,
        rowCount,
        state: {
            sorting: currentSorting,
            pagination: currentPagination,
            columnFilters,
            rowSelection,
        },
    });

    const computedPageSizeOptions = manualPagination
        ? paginationOptions.pageSize
        : (() => {
            const localRowCount = table.getFilteredRowModel().rows.length;
            const allSizes = [...paginationOptions.pageSize].sort((a, b) => a - b);
            const validSizes = allSizes.filter((size) => size <= localRowCount);
            const nextSize = allSizes.find((size) => size > localRowCount);
            if (nextSize) validSizes.push(nextSize);
            return validSizes.length > 0 ? validSizes : allSizes.slice(0, 1);
        })();

    const hasRowsForPagination = manualPagination ? (rowCount ?? 0) >= 1 : table.getFilteredRowModel().rows.length >= 1;

    return (
        <div className="flex flex-col h-full">
            {(toolbar || enableFilter || selectedActions) && (
                <div className="flex items-center py-4">
                    {toolbar ? (
                        toolbar
                    ) : enableFilter ? (
                        <Input
                            placeholder={`${filterOptions.title ?? `Filter by ${filterOptions.key}`}`}
                            value={(table.getColumn(filterOptions.key)?.getFilterValue() as string) ?? ""}
                            onChange={(event) => table.getColumn(filterOptions.key)?.setFilterValue(event.target.value)}
                            className="max-w-sm"
                        />
                    ) : null}
                    {selectedActions && selectedActions(table.getSelectedRowModel().rows.map((row) => row.original))}
                </div>
            )}
            <div className="flex flex-col justify-between h-full">
                <div className="rounded-md border w-full overflow-x-auto">
                    <Table className="w-full">
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className={highlightRow && highlightRow(row.original) ? "bg-gray-100 pointer-events-none" : ""}
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={finalColumns.length} className="p-0">
                                        {emptyState ? (
                                            emptyState
                                        ) : emptyButton ? (
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
                    {enablePagination && hasRowsForPagination && (
                        <TablePagination
                            table={table}
                            maxVisiblePages={paginationOptions.pageVisible}
                            pageSizeOptions={computedPageSizeOptions}
                            className={paginationOptions.className}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
