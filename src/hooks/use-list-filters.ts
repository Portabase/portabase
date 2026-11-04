"use client";

import {useSearchParams} from "next/navigation";
import {useCallback, useMemo, useState} from "react";
import type {FiltersWrapperProps} from "@/components/common/filters/filters-wrapper";
import {
    applyListFilters,
    buildFilterParams,
    readFiltersFromSearchParams,
    writeFiltersToSearchParams,
} from "@/components/common/filters/list-filters";
import type {FilterParams, GenericFilter, GenericFilterConfig} from "@/components/common/filters/types";

type UseListFiltersOptions = {
    filtersConfig: GenericFilterConfig[];
    searchKeys: string[];
    searchPlaceholder?: string;
    defaultFilters?: GenericFilter[];
};

export function useListFilters<TRow>({filtersConfig, searchKeys, searchPlaceholder, defaultFilters}: UseListFiltersOptions) {
    const searchParams = useSearchParams();
    const [filters, setFiltersState] = useState(() => {
        const urlFilters = readFiltersFromSearchParams(searchParams, filtersConfig);
        return defaultFilters && urlFilters.length === 0 ? defaultFilters : urlFilters;
    });

    const search = searchKeys.length > 0 ? (searchParams.get("search") ?? "") : "";

    const writeUrl = useCallback((nextFilters: GenericFilter[], nextSearch: string) => {
        const currentSearchParams = new URLSearchParams(window.location.search);
        const nextQuery = writeFiltersToSearchParams(currentSearchParams, filtersConfig, nextFilters, nextSearch).toString();
        const pathname = window.location.pathname;
        window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }, [filtersConfig]);

    const setFilters = useCallback((nextFilters: GenericFilter[]) => {
        setFiltersState(nextFilters);
        writeUrl(nextFilters, new URLSearchParams(window.location.search).get("search") ?? "");
    }, [writeUrl]);

    const setSearch = useCallback((nextSearch: string) => {
        writeUrl(readFiltersFromSearchParams(new URLSearchParams(window.location.search), filtersConfig), nextSearch);
    }, [writeUrl, filtersConfig]);

    const paramsKey = JSON.stringify(buildFilterParams(filters, search));
    const params = useMemo(() => JSON.parse(paramsKey) as FilterParams, [paramsKey]);

    const apply = useCallback(
        (rows: TRow[]) => applyListFilters(rows, filters, search, searchKeys),
        [filters, search, searchKeys],
    );

    const filtersProps: FiltersWrapperProps = {
        availableFilters: filtersConfig,
        filters,
        setFilters,
        search,
        setSearch,
        searchPlaceholder,
    };

    return {filtersProps, params, apply};
}
