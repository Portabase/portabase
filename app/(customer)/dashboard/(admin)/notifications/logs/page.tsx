import {PageParams} from "@/types/next";
import {Page, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {Metadata} from "next";
import {NotificationLogsList} from "@/features/notifications/components/notification-logs-list";
import type {GenericFilterConfig} from "@/components/common/filters/types";
import {eventKindEnum} from "@/db/schema/10_alert-policy";
import {providerKindEnum} from "@/db/schema/09_notification-channel";

export const metadata: Metadata = {
    title: "Activity logs",
};

const filtersConfig: GenericFilterConfig[] = [
    {
        type: "status",
        label: "Status",
        options: [
            {value: "delivered", label: "Delivered"},
            {value: "failed", label: "Failed"},
        ],
    },
    {
        type: "event",
        label: "Event",
        options: eventKindEnum.enumValues
            .filter((event) => event !== "weekly_report")
            .map((event) => ({value: event, label: event})),
    },
    {
        type: "provider",
        label: "Channel",
        options: providerKindEnum.enumValues.map((provider) => ({value: provider, label: provider})),
    },
];

export default async function RoutePage(props: PageParams<{}>) {
    return (
        <Page>
            <PageHeader>
                <PageTitle>Activity logs</PageTitle>
            </PageHeader>
            <PageContent>
                <NotificationLogsList filtersConfig={filtersConfig}/>
            </PageContent>
        </Page>
    );
}
