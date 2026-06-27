"use server";

import { getOrganization } from "@/lib/auth/auth";
import { db } from "@/db";
import { and, eq } from "drizzle-orm";
import * as drizzleDb from "@/db";
import { project } from "@/db/schema/06_project";

export async function getOrganizationProject(organizationId: string) {
  return db.query.project.findFirst({
    where: eq(project.organizationId, organizationId),
    with: {
      databases: true,
    },
  });
}

export const getOrganizationProjectDatabases = async ({
  organizationSlug,
  projectId,
}: {
  organizationSlug: string;
  projectId: string;
}) => {
  try {
    const organization = await getOrganization({});

    if (!organization) {
      return {
        name: "ErrorGettingOrganizationProjectDatabases",
        message: "No organization found.",
        status: 400,
        cause: "Unknown error occurred.",
      };
    }
    const databasesProject = await db.query.project.findFirst({
      where: and(
        eq(drizzleDb.schemas.project.organizationId, organization.id),
        eq(drizzleDb.schemas.project.id, projectId),
      ),
      with: {
        databases: true,
      },
    });

    if (!databasesProject) {
      return {
        name: "ErrorGettingOrganizationProjectDatabases",
        message: "No organization found.",
        status: 400,
        cause: "Unknown error occurred.",
      };
    }

    return {
      data: databasesProject.databases,
      ids: databasesProject.databases.map((project) => project.id),
    };
  } catch (e: any) {
    const errorMessage =
      e?.response?.data?.message || e?.message || "Unknown auth error";
    const status = e?.response?.status || 500;

    console.error("API GettingOrganizationProjectDatabases error:", {
      message: errorMessage,
      status,
      raw: e,
    });

    throw {
      name: "ErrorGettingOrganizationProjectDatabases",
      message: errorMessage,
      status,
      cause: e,
    };
  }
};
