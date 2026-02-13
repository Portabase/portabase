import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { PaginationIndexes } from "@/components/wrappers/common/pagination/pagination-indexes";
import { cn } from "@/lib/utils";

export type paginationNavigationProps = {
    className?: string;
    totalPages: number;
    currentPage: number;
    goToPage: (page: number) => void;
    goToPrevPage: () => void;
    goToNextPage: () => void;
    maxVisiblePages?: number;
};

export const PaginationNavigation = (props: paginationNavigationProps) => {
    const { className, totalPages, currentPage, goToPage, goToPrevPage, goToNextPage, maxVisiblePages = 3 } = props;

    if (totalPages <= 1) return null;

    return (
        <Pagination className={cn("", className)}>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious onClick={goToPrevPage} />
                </PaginationItem>
                <PaginationIndexes totalPages={totalPages} currentPage={currentPage} handlePageChange={goToPage} maxVisiblePages={maxVisiblePages} />
                <PaginationItem>
                    <PaginationNext onClick={goToNextPage} />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
};
