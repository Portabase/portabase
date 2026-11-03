"use client";

import React, { ComponentType, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

import { PaginationNavigation } from "@/components/common/pagination-navigation";
import { PaginationSize } from "@/components/common/pagination-size";
import { FiltersWrapper } from "@/components/common/filters/filters-wrapper";
import type { GenericFilterConfig } from "@/components/common/filters/types";
import { useListFilters } from "@/hooks/use-list-filters";

const NO_FILTERS: GenericFilterConfig[] = [];
const NO_SEARCH_KEYS: string[] = [];

interface CardsWithPaginationProps<T> {
    className?: string;
    data: any[];
    organizationSlug?: string;
    cardItem: ComponentType<{ data: T } & Record<string, any>>;
    cardsPerPage?: number;
    numberOfColumns?: number;
    maxVisiblePages?: number;
    pageSizeOptions?: number[];
    filtersConfig?: GenericFilterConfig[];
    searchKeys?: string[];
    searchPlaceholder?: string;
    [key: string]: any;
}

export function CardsWithPagination<T>(props: CardsWithPaginationProps<T>) {
    const { className, organizationSlug, data, cardItem, cardsPerPage = 5, numberOfColumns = 1, maxVisiblePages = 3, pageSizeOptions, filtersConfig = NO_FILTERS, searchKeys = NO_SEARCH_KEYS, searchPlaceholder, ...rest } = props;

    const CardItem = cardItem;

    const { filtersProps, params, apply } = useListFilters<T>({ filtersConfig, searchKeys, searchPlaceholder });
    const showFilterBar = filtersConfig.length > 0 || searchKeys.length > 0;
    const filteredData = apply(data);

    const [pageSize, setPageSize] = useState(cardsPerPage);
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredData.length / pageSize);
    const page = Math.min(currentPage, Math.max(1, totalPages));

    useEffect(() => {
        setCurrentPage(1);
    }, [params]);

    const indexOfLastCard = page * pageSize;
    const indexOfFirstCard = indexOfLastCard - pageSize;
    const currentCards = filteredData.slice(indexOfFirstCard, indexOfLastCard);

    const goToPage = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    const goToPrevPage = () => {
        goToPage(Math.max(1, page - 1));
    };

    const goToNextPage = () => {
        goToPage(Math.min(totalPages, page + 1));
    };

    const handlePageSizeChange = (newSize: number) => {
        if (!Number.isFinite(newSize) || newSize < 1) return;
        setPageSize(newSize);
        setCurrentPage(1);
    };

    const showSizeSelector = pageSizeOptions && pageSizeOptions.length > 0;

    return (
        <div className={cn("flex flex-col h-full justify-between", className)}>
            <div className="flex flex-col gap-4">
                {showFilterBar && <FiltersWrapper {...filtersProps} />}
                <div className={cn(`grid h-max auto-rows-min gap-4 md:grid-cols-${numberOfColumns}`)}>
                    {currentCards.map((card, key) => (
                        <CardItem key={key} data={card} organizationSlug={organizationSlug}  {...rest} />
                    ))}
                </div>
                {data.length > 0 && filteredData.length === 0 && (
                    <p className="text-sm text-muted-foreground">No results</p>
                )}
            </div>
            <div className="flex items-center justify-end mt-4 gap-4">
                {showSizeSelector && (
                    <PaginationSize
                        pageSize={pageSize}
                        onPageSizeChange={handlePageSizeChange}
                        pageSizeOptions={pageSizeOptions}
                    />
                )}
                <PaginationNavigation
                    className="justify-end"
                    totalPages={totalPages}
                    currentPage={page}
                    goToPage={goToPage}
                    goToPrevPage={goToPrevPage}
                    goToNextPage={goToNextPage}
                    maxVisiblePages={maxVisiblePages}
                />
            </div>
        </div>
    );
}
