"use client";

import {useSearchParams} from "next/navigation";
import {useCallback, useMemo, useState} from "react";
import type {FiltersWrapperProps} from "@/components/common/filters/filters-wrapper";
import {
    applyListFilters,
    buildFilterParams,
    hasFilterParams,
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
    const [hasChangedFilters, setHasChangedFilters] = useState(false);
    const query = searchParams.toString();

    const filters = useMemo(() => {
        const currentSearchParams = new URLSearchParams(query);
        if (defaultFilters && !hasChangedFilters && !hasFilterParams(currentSearchParams, filtersConfig)) {
            return defaultFilters;
        }
        return readFiltersFromSearchParams(currentSearchParams, filtersConfig);
    }, [query, filtersConfig, defaultFilters, hasChangedFilters]);

    const search = searchKeys.length > 0 ? (searchParams.get("search") ?? "") : "";

    const writeUrl = useCallback((nextFilters: GenericFilter[], nextSearch: string) => {
        const currentSearchParams = new URLSearchParams(window.location.search);
        const nextQuery = writeFiltersToSearchParams(currentSearchParams, filtersConfig, nextFilters, nextSearch).toString();
        const pathname = window.location.pathname;
        window.history.replaceState(null, "", nextQuery ? `${pathname}?${nextQuery}` : pathname);
    }, [filtersConfig]);

    const setFilters = useCallback((nextFilters: GenericFilter[]) => {
        setHasChangedFilters(true);
        writeUrl(nextFilters, new URLSearchParams(window.location.search).get("search") ?? "");
    }, [writeUrl]);

    const setSearch = useCallback((nextSearch: string) => {
        const currentSearchParams = new URLSearchParams(window.location.search);
        const currentFilters = hasChangedFilters || hasFilterParams(currentSearchParams, filtersConfig)
            ? readFiltersFromSearchParams(currentSearchParams, filtersConfig)
            : defaultFilters ?? [];
        writeUrl(currentFilters, nextSearch);
    }, [writeUrl, filtersConfig, defaultFilters, hasChangedFilters]);

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
