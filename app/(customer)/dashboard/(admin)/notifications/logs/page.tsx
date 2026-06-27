import {PageParams} from "@/types/next";
import {Page, PageContent, PageHeader, PageTitle} from "@/features/layout/components/page";
import {Metadata} from "next";
import {NotificationLogsList} from "@/features/notifications/components/notification-logs-list";
import {notFound} from "next/navigation";
import {getNotificationHistory} from "@/db/services/notification-log";

export const metadata: Metadata = {
    title: "Activity logs",
};

export default async function RoutePage(props: PageParams<{}>) {

    const notificationLogs = await getNotificationHistory()

    if (!notificationLogs) {
        notFound();
    }

    return (
        <Page>
            <PageHeader>
                <PageTitle>Activity logs</PageTitle>
            </PageHeader>
            <PageContent>
                <NotificationLogsList notificationLogs={notificationLogs} />
            </PageContent>
        </Page>
    );
}
