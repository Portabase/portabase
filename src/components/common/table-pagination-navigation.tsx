import { PaginationNavigation } from "@/components/common/pagination-navigation";

export type paginationNavigationProps = {
    className?: string;
    table: any;
    maxVisiblePages?: number;
};

export const TablePaginationNavigation = (props: paginationNavigationProps) => {
    const { className, table, maxVisiblePages = 3 } = props;

    const totalPages = table.getPageCount();
    const currentPage = table.getState().pagination.pageIndex + 1;

    const goToPage = (page: number) => {
        table.setPageIndex(page - 1);
    };

    const goToPrevPage = () => {
        if (table.getCanPreviousPage()) table.previousPage();
    };

    const goToNextPage = () => {
        if (table.getCanNextPage()) table.nextPage();
    };

    return (
        <PaginationNavigation
            className={className}
            totalPages={totalPages}
            currentPage={currentPage}
            goToPage={goToPage}
            goToPrevPage={goToPrevPage}
            goToNextPage={goToNextPage}
            maxVisiblePages={maxVisiblePages}
        />
    );
};
