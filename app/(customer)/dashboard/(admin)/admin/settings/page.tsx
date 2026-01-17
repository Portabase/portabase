import {PageParams} from "@/types/next";
import {Page, PageContent, PageHeader, PageTitle} from "@/features/layout/page";
import {db} from "@/db";
import {notFound} from "next/navigation";

export default async function RoutePage(props: PageParams<{}>) {

    const settings = await db.query.setting.findFirst({
        where: (fields, {eq}) => eq(fields.name, "system"),
    });

    if (!settings) {
        notFound()
    }


    return (
        <Page>
            <PageHeader className="flex flex-col">
                <div className="flex justify-between">
                    <PageTitle className="mb-3">System settings</PageTitle>
                </div>
            </PageHeader>
            <PageContent className="flex flex-col gap-5">
            </PageContent>
        </Page>
    );
}
