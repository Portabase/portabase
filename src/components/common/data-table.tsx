"use client";
import {
    flexRender,
    useTable,
    SortingState,
    PaginationState,
    OnChangeFn,
    RowData,
} from "@tanstack/react-table";
import { features, type AppColumnDef as ColumnDef } from "./table-features";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { TablePagination } from "./table-pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FiltersWrapper } from "@/components/common/filters/filters-wrapper";
import { NoResults } from "@/components/common/filters/no-results";
import type { GenericFilterConfig } from "@/components/common/filters/types";
import { useListFilters } from "@/hooks/use-list-filters";

const NO_FILTERS: GenericFilterConfig[] = [];
const NO_SEARCH_KEYS: string[] = [];

interface DataTableProps<TData extends RowData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    enableSelect?: boolean;
    enablePagination?: boolean;
    paginationOptions?: {
        pageSize: number[];
        pageVisible: number;
        className?: string;
    };
    filtersConfig?: GenericFilterConfig[];
    searchKeys?: string[];
    searchPlaceholder?: string;
    emptyButton?: {
        text: string;
        variant: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
        path: string;
    };
    highlightRow?: (row: TData) => boolean;
    selectedActions?: (rows: TData[]) => ReactNode;
    manualPagination?: boolean;
    rowCount?: number;
    paginationState?: { pageIndex: number; pageSize: number };
    onPaginationChange?: OnChangeFn<PaginationState>;
    sorting?: SortingState;
    onSortingChange?: OnChangeFn<SortingState>;
    isFetching?: boolean;
    isFiltered?: boolean;

}

export function DataTable<TData extends RowData, TValue>({
                                             columns,
                                             data,
                                             enablePagination = true,
                                             enableSelect = true,
                                             paginationOptions = {pageSize: [10, 20, 30, 40, 50, 100], pageVisible: 3},
                                             filtersConfig = NO_FILTERS,
                                             searchKeys = NO_SEARCH_KEYS,
                                             searchPlaceholder,
                                             emptyButton,
                                             highlightRow,
                                             selectedActions,
                                             manualPagination = false,
                                             rowCount,
                                             paginationState,
                                             onPaginationChange,
                                             sorting: controlledSorting,
                                             onSortingChange: controlledOnSortingChange,
                                             isFetching = false,
                                             isFiltered = false,


                                         }: DataTableProps<TData, TValue>) {
    const [internalSorting, setInternalSorting] = useState<SortingState>([]);
    const sorting = controlledSorting ?? internalSorting;
    const setSorting = controlledOnSortingChange ?? setInternalSorting;
    const [rowSelection, setRowSelection] = useState({});

    const {filtersProps, params, apply} = useListFilters<TData>({filtersConfig, searchKeys, searchPlaceholder});
    const showFilterBar = filtersConfig.length > 0 || searchKeys.length > 0;
    const tableData = manualPagination ? data : apply(data);

    const finalColumns = useMemo(() => {
        const selectColumnExists = columns.some((column) => column.id === "select");
        if (enableSelect && tableData.length > 0 && !selectColumnExists) {
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
    }, [columns, enableSelect, tableData.length]);

    const table = useTable({
        features,
        data: tableData,
        columns: finalColumns as ColumnDef<TData>[],
        onSortingChange: setSorting,
        onRowSelectionChange: setRowSelection,
        getRowId: (row: any) => row.id || row.uuid,
        autoResetPageIndex: false,
        enableRowSelection: true,
        manualPagination,
        manualSorting: manualPagination,
        rowCount: manualPagination ? rowCount : undefined,
        ...(manualPagination && onPaginationChange ? { onPaginationChange } : {}),
        state: {
            sorting,
            rowSelection,
            ...(manualPagination && paginationState ? { pagination: paginationState } : {}),
        },
    });
    const router = useRouter();

    useEffect(() => {
        if (!manualPagination) table.setPageIndex(0);
    }, [params]);

    const isUnfilteredEmpty = data.length === 0 && !isFiltered;

    const pageCount = table.getPageCount();
    const pageIndex = table.state.pagination.pageIndex;

    useEffect(() => {
        if (!manualPagination && pageCount > 0 && pageIndex >= pageCount) table.setPageIndex(pageCount - 1);
    }, [manualPagination, pageCount, pageIndex]);

    return (
        <div className="flex flex-col h-full">
            {(showFilterBar || selectedActions) && (
                <div className="flex flex-wrap items-center gap-2 py-4">
                    {showFilterBar && <FiltersWrapper {...filtersProps}/>}
                    {selectedActions &&
                        selectedActions(
                            table.getSelectedRowModel().rows.map((row) => row.original),
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
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext(),
                                                    )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className={
                                            highlightRow && highlightRow(row.original)
                                                ? "bg-gray-100 pointer-events-none"
                                                : ""
                                        }
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="p-0">
                                        {emptyButton && isUnfilteredEmpty ? (
                                            <Button
                                                variant={emptyButton.variant}
                                                className="btn btn-primary cursor-pointer w-full rounded-tr-none rounded-tl-none py-12 text-lg font-bold"
                                                onClick={() => {
                                                    router.push(emptyButton.path);
                                                }}
                                            >
                                                <span>{emptyButton.text}</span>
                                            </Button>
                                        ) : isUnfilteredEmpty ? (
                                            <div className="flex items-center justify-center py-12 text-lg font-bold">
                                                <span className="text-lg font-bold">No data available</span>
                                            </div>
                                        ) : (
                                            <NoResults/>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                {(enableSelect || enablePagination) && (
                    <div className="flex items-center justify-end space-x-2 py-4 mt-6">
                        {enableSelect && table.getFilteredRowModel().rows.length >= 1 && (
                            <div className="flex-1 text-sm text-muted-foreground">
                                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                                {table.getFilteredRowModel().rows.length} row(s) selected.
                            </div>
                        )}
                        {enablePagination &&
                            (manualPagination
                                ? (rowCount ?? 0) > 0
                                : table.getFilteredRowModel().rows.length >= 1) && (
                                <TablePagination
                                    table={table}
                                    maxVisiblePages={paginationOptions?.pageVisible}
                                    pageSizeOptions={
                                        manualPagination
                                            ? paginationOptions.pageSize
                                            : (() => {
                                                const rowCountLocal = table.getFilteredRowModel().rows.length;
                                                const allSizes = paginationOptions.pageSize.sort((a, b) => a - b);
                                                const validSizes = allSizes.filter((size) => size <= rowCountLocal);
                                                const nextSize = allSizes.find((size) => size > rowCountLocal);
                                                if (nextSize) validSizes.push(nextSize);
                                                return validSizes;
                                            })()
                                    }
                                    className={paginationOptions.className}
                                />
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
