import {
    tableFeatures,
    columnFilteringFeature,
    columnVisibilityFeature,
    rowPaginationFeature,
    rowSelectionFeature,
    rowSortingFeature,
    createFilteredRowModel,
    createPaginatedRowModel,
    createSortedRowModel,
    filterFn_arrIncludes,
    filterFn_equals,
    filterFn_inDateRange,
    filterFn_inNumberRange,
    filterFn_includesString,
    filterFn_weakEquals,
    sortFn_alphanumeric,
    sortFn_basic,
    sortFn_datetime,
    sortFn_text,
    type Column,
    type ColumnDef,
    type RowData,
} from "@tanstack/react-table";

const appFilterFns = {
    includesString: filterFn_includesString,
    inNumberRange: filterFn_inNumberRange,
    equals: filterFn_equals,
    arrIncludes: filterFn_arrIncludes,
    inDateRange: filterFn_inDateRange,
    weakEquals: filterFn_weakEquals,
};

const appSortFns = {
    datetime: sortFn_datetime,
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    basic: sortFn_basic,
};

export const features = tableFeatures({
    rowSortingFeature,
    columnFilteringFeature,
    columnVisibilityFeature,
    rowPaginationFeature,
    rowSelectionFeature,
    sortedRowModel: createSortedRowModel(),
    filteredRowModel: createFilteredRowModel(),
    paginatedRowModel: createPaginatedRowModel(),
    filterFns: appFilterFns,
    sortFns: appSortFns,
});

export type AppTableFeatures = typeof features;

export type AppColumnDef<TData extends RowData, TValue = unknown> = ColumnDef<
    AppTableFeatures,
    TData,
    TValue
>;

export type AppColumn<TData extends RowData, TValue = unknown> = Column<
    AppTableFeatures,
    TData,
    TValue
>;
