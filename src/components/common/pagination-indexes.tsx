import { PaginationEllipsis, PaginationItem, PaginationLink } from "@/components/ui/pagination";

export type paginationItemsProps = {
    totalPages: number;
    currentPage: number;
    handlePageChange: (page: number) => void;
    maxVisiblePages?: number;
};

export const PaginationIndexes = (props: paginationItemsProps) => {
    const { totalPages, currentPage, handlePageChange, maxVisiblePages = 3 } = props;

    const items = [];

    if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }
    } else {
        if (currentPage <= 2) {
            for (let i = 1; i <= maxVisiblePages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
            items.push(
                <PaginationItem key="ellipsis1">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        } else if (currentPage >= totalPages - 1) {
            items.push(
                <PaginationItem key="ellipsis2">
                    <PaginationEllipsis />
                </PaginationItem>
            );
            for (let i = totalPages - 2; i <= totalPages; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
        } else {
            items.push(
                <PaginationItem key="ellipsis3">
                    <PaginationEllipsis />
                </PaginationItem>
            );
            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                items.push(
                    <PaginationItem key={i}>
                        <PaginationLink onClick={() => handlePageChange(i)} isActive={currentPage === i}>
                            {i}
                        </PaginationLink>
                    </PaginationItem>
                );
            }
            items.push(
                <PaginationItem key="ellipsis4">
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }
    }

    return items;
};
