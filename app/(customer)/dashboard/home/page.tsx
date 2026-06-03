import { PageParams } from "@/types/next"
import { Page, PageContent, PageHeader, PageTitle } from "@/features/layout/page"
import { Metadata } from "next"
import { StatsLayout } from "@/features/stats/layouts/stats-layout"
import { DASHBOARD_MOCK } from "@/features/stats/mock-data"

export const metadata: Metadata = {
  title: "Home",
}

export default async function RoutePage(_props: PageParams<{}>) {
  // TODO: remplacer DASHBOARD_MOCK par vraies queries DB
  return (
    <Page>
      <PageHeader>
        <PageTitle>Dashboard</PageTitle>
      </PageHeader>
      <PageContent className="flex flex-col gap-y-4">
        <StatsLayout data={DASHBOARD_MOCK} />
      </PageContent>
    </Page>
  )
}
