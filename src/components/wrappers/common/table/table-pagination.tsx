"use client";

import {TablePaginationNavigation} from "@/components/wrappers/common/table/table-pagination-navigation";
import {TablePaginationSize} from "@/components/wrappers/common/table/table-pagination-size";
import {cn} from "@/lib/utils";

interface tablePaginationProps {
    className?: string;
    table: any;
    maxVisiblePages?: number;
    pageSizeOptions?: number[];
}

export function TablePagination(props: tablePaginationProps) {
    const {className, table, maxVisiblePages = 3, pageSizeOptions = [10, 20, 30, 40, 50]} = props;

    const totalPages = table.getPageCount();

    if (totalPages <= 1) return null;

    return (
        <div
            className={cn("flex gap-x-4", className)}
        >
            <TablePaginationSize table={table} pageSizeOptions={pageSizeOptions}/>
            <TablePaginationNavigation table={table} maxVisiblePages={maxVisiblePages} className="justify-end mt-0"/>
        </div>
    );
}
