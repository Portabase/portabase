import { useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type tablePaginationSizeProps = {
    className?: string;
    table: any;
    pageSizeOptions?: number[];
};

export const TablePaginationSize = (props: tablePaginationSizeProps) => {
    const { className, table, pageSizeOptions = [10, 20, 30, 40, 50] } = props;

    useEffect(() => {
        table.setPageSize(Number(pageSizeOptions[0]));
    }, []);

    return (
        <div className={cn("flex items-center justify-end sm:justify-center space-x-2", className)}>
            <p className="whitespace-nowrap text-sm font-medium hidden md:block">Rows per page</p>
            <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                    table.setPageSize(Number(value));
                }}
            >
                <SelectTrigger className="h-8 w-[4.5rem]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                    {pageSizeOptions.map((pageSize) => (
                        <SelectItem key={pageSize} value={`${pageSize}`}>
                            {pageSize}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
