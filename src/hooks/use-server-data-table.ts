import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { PaginationState, SortingState } from "@tanstack/react-table";
import { useEffect, useState } from "react";

interface PaginatedResult<TData> {
    data: TData[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
        [key: string]: any;
    };
}

interface UseServerDataTableProps<TData, TParams> {
    fetchAction: any;
    queryKey: any[];
    extraParams?: Partial<TParams>;
    initialPageSize?: number;
    initialSorting?: SortingState;
    enabled?: boolean;
    refetchInterval?: number | false;
}

const EMPTY_ARRAY: any[] = [];

export function useServerDataTable<TData, TParams>(
    props: UseServerDataTableProps<TData, TParams>,
) {
    const {
        fetchAction,
        queryKey,
        extraParams,
        initialPageSize = 20,
        initialSorting = [],
        enabled = true,
        refetchInterval = false,
    } = props;

    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: initialPageSize,
    });
    const [sorting, setSorting] = useState<SortingState>(initialSorting);

    useEffect(() => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, [sorting]);

    useEffect(() => {
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, [JSON.stringify(extraParams)]);

    const query = useQuery({
        queryKey: [
            ...queryKey,
            pagination.pageIndex,
            pagination.pageSize,
            sorting,
            JSON.stringify(extraParams),
        ],
        queryFn: async () => {
            const response = await fetchAction({
                page: pagination.pageIndex + 1,
                pageSize: pagination.pageSize,
                sorting,
                ...extraParams,
            } as any);

            const result = response?.data as PaginatedResult<TData> | undefined;
            if (!result || !Array.isArray(result.data)) {
                throw new Error("Failed to fetch paginated data");
            }
            return result;
        },
        placeholderData: keepPreviousData,
        enabled,
        gcTime: 2 * 60 * 1000,
        staleTime: 30 * 1000,
        refetchInterval,
        refetchOnWindowFocus: true,
        retry: 1,
    });

    return {
        data: (query.data?.data as TData[]) || EMPTY_ARRAY,
        rowCount: query.data?.meta?.total || 0,
        pagination,
        onPaginationChange: setPagination,
        sorting,
        onSortingChange: setSorting,
        tableProps: {
            manualPagination: true as const,
            rowCount: query.data?.meta?.total || 0,
            paginationState: pagination,
            onPaginationChange: setPagination,
            sorting,
            onSortingChange: setSorting,
        },
        meta: query.data?.meta,
        isLoading: query.isPending,
        isFetching: query.isFetching,
        refetch: query.refetch,
    };
}
