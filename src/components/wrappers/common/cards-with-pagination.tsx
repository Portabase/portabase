"use client";

import React, { ComponentType, useState } from "react";
import { cn } from "@/lib/utils";

import { PaginationNavigation } from "@/components/wrappers/common/pagination/pagination-navigation";
import { PaginationSize } from "@/components/wrappers/common/pagination/pagination-size";

interface CardsWithPaginationProps<T> {
    className?: string;
    data: any[];
    organizationSlug?: string;
    cardItem: ComponentType<{ data: T } & Record<string, any>>;
    cardsPerPage?: number;
    numberOfColumns?: number;
    maxVisiblePages?: number;
    pageSizeOptions?: number[];
    [key: string]: any;
}

export function CardsWithPagination<T>(props: CardsWithPaginationProps<T>) {
    const { className, organizationSlug, data, cardItem, cardsPerPage = 5, numberOfColumns = 1, maxVisiblePages = 3, pageSizeOptions, ...rest } = props;

    const CardItem = cardItem;

    const [pageSize, setPageSize] = useState(cardsPerPage);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(data.length / pageSize);

    const indexOfLastCard = currentPage * pageSize;
    const indexOfFirstCard = indexOfLastCard - pageSize;
    const currentCards = data.slice(indexOfFirstCard, indexOfLastCard);

    const goToPage = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const goToPrevPage = () => {
        goToPage(Math.max(1, currentPage - 1));
    };

    const goToNextPage = () => {
        goToPage(Math.min(totalPages, currentPage + 1));
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    };

    return (
        <div className={cn("flex flex-col h-full justify-between", className)}>
            <div className={cn(`grid h-max auto-rows-min gap-4 md:grid-cols-${numberOfColumns}`)}>
                {currentCards.map((card, key) => (
                    <CardItem key={key} data={card} organizationSlug={organizationSlug}  {...rest} />
                ))}
            </div>
            <div className="flex items-center justify-end mt-4 gap-4">
                {pageSizeOptions && (
                    <PaginationSize
                        pageSize={pageSize}
                        onPageSizeChange={handlePageSizeChange}
                        pageSizeOptions={pageSizeOptions}
                    />
                )}
                <PaginationNavigation
                    totalPages={totalPages}
                    currentPage={currentPage}
                    goToPage={goToPage}
                    goToPrevPage={goToPrevPage}
                    goToNextPage={goToNextPage}
                    maxVisiblePages={maxVisiblePages}
                />
            </div>
        </div>
    );
}
