"use client"
import {DataTable} from "@/components/common/data-table";
import {
    notificationLogsColumns,
} from "@/features/notifications/components/notification-log-columns";
import type {NotificationLogWithRelations} from "@/db/services/notification-log";
import type {GenericFilterConfig} from "@/components/common/filters/types";
import {FiltersWrapper} from "@/components/common/filters/filters-wrapper";
import {useListFilters} from "@/hooks/use-list-filters";
import {useServerDataTable} from "@/hooks/use-server-data-table";
import {fetchNotificationLogsAction} from "@/features/notifications/actions/notification-log-list.action";
import type {FetchNotificationLogsSchema} from "@/features/notifications/actions/notification-log-list.schema";
import {getChannelIcon} from "@/features/channel/components/channels-helpers";

type NotificationsLogsListProps = {
    filtersConfig: GenericFilterConfig[];
}

export const NotificationLogsList = ({filtersConfig}: NotificationsLogsListProps) => {
    const filtersConfigWithIcons = filtersConfig.map((config) => config.type === "provider"
        ? {...config, options: config.options?.map((option) => ({...option, icon: getChannelIcon(option.value)}))}
        : config);

    const {filtersProps, params} = useListFilters({filtersConfig: filtersConfigWithIcons, searchKeys: []});

    const {data, tableProps, isFetching, isLoading} = useServerDataTable<NotificationLogWithRelations, FetchNotificationLogsSchema>({
        fetchAction: fetchNotificationLogsAction,
        queryKey: ["notification-logs"],
        extraParams: params as Partial<FetchNotificationLogsSchema>,
        initialPageSize: 20,
    });

    return (
        <div className="flex flex-col gap-4">
            <FiltersWrapper {...filtersProps}/>
            <DataTable
                enableSelect={false}
                columns={notificationLogsColumns()}
                data={data}
                enablePagination
                isFetching={isFetching || isLoading}
                isFiltered={filtersProps.filters.length > 0}
                {...tableProps}
            />
        </div>
    )
}
