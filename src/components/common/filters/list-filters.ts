import type {FilterOperator, FilterParams, GenericFilter, GenericFilterConfig} from "./types";

export const DEFAULT_OPERATORS: FilterOperator[] = ["is", "is_not"];

const FILTER_KEY_PATTERN = /^(.+)\[(.+)\]$/;

export function readPath(row: unknown, path: string): unknown {
    return path.split(".").reduce<unknown>(
        (value, key) => (value === null || value === undefined ? undefined : (value as Record<string, unknown>)[key]),
        row,
    );
}

function toText(value: unknown): string {
    return value === null || value === undefined ? "" : String(value);
}

export function applyListFilters<TRow>(rows: TRow[], filters: GenericFilter[], search: string, searchKeys: string[]): TRow[] {
    const activeFilters = filters.filter((filter) => filter.value.length > 0);
    const searchText = search.trim().toLowerCase();
    const searchActive = searchText.length > 0 && searchKeys.length > 0;

    if (activeFilters.length === 0 && !searchActive) return rows;

    return rows.filter((row) => {
        const matchesFilters = activeFilters.every((filter) => {
            const included = filter.value.includes(toText(readPath(row, filter.type)));
            return filter.operator === "is_not" ? !included : included;
        });
        if (!matchesFilters) return false;
        if (!searchActive) return true;
        return searchKeys.some((key) => toText(readPath(row, key)).toLowerCase().includes(searchText));
    });
}

function filterKeyType(key: string): string | null {
    return key.match(FILTER_KEY_PATTERN)?.[1] ?? null;
}

export function hasFilterParams(searchParams: URLSearchParams, filtersConfig: GenericFilterConfig[]): boolean {
    const configuredTypes = new Set(filtersConfig.map((config) => config.type));
    return [...searchParams.keys()].some((key) => {
        const type = filterKeyType(key);
        return type !== null && configuredTypes.has(type);
    });
}

export function readFiltersFromSearchParams(searchParams: URLSearchParams, filtersConfig: GenericFilterConfig[]): GenericFilter[] {
    const keys = [...new Set(searchParams.keys())];
    const filters: GenericFilter[] = [];

    for (const config of filtersConfig) {
        const operators = config.operators ?? DEFAULT_OPERATORS;
        const allowedValues = config.options?.length ? new Set(config.options.map((option) => option.value)) : null;

        for (const key of keys) {
            const match = key.match(FILTER_KEY_PATTERN);
            if (!match || match[1] !== config.type) continue;
            const operator = match[2] as FilterOperator;
            if (!operators.includes(operator)) continue;

            const value = searchParams.getAll(key).filter((item) => allowedValues === null || allowedValues.has(item));
            if (value.length === 0) continue;

            filters.push({type: config.type, operator, value});
            break;
        }
    }

    return filters;
}

export function writeFiltersToSearchParams(
    searchParams: URLSearchParams,
    filtersConfig: GenericFilterConfig[],
    filters: GenericFilter[],
    search: string,
): URLSearchParams {
    const configuredTypes = new Set(filtersConfig.map((config) => config.type));
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    nextSearchParams.delete("search");
    for (const key of [...new Set(nextSearchParams.keys())]) {
        const type = filterKeyType(key);
        if (type !== null && configuredTypes.has(type)) nextSearchParams.delete(key);
    }

    if (search) nextSearchParams.append("search", search);
    for (const filter of filters) {
        for (const value of filter.value) {
            nextSearchParams.append(`${filter.type}[${filter.operator}]`, value);
        }
    }

    return nextSearchParams;
}

export function buildFilterParams(filters: GenericFilter[], search: string): FilterParams {
    const params: FilterParams = {search};
    for (const filter of filters) {
        params[filter.type] = filter.value;
        params[`${filter.type}Operator`] = filter.operator;
    }
    return params;
}
