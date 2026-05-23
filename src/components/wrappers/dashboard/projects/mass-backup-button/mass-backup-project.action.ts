"use server";

import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import * as drizzleDb from "@/db";
import { ServerActionResult } from "@/types/action-type";
import { userAction } from "@/lib/safe-actions/actions";

export type MassBackupProjectResult = {
  count: number;
  skipped: number;
};

export const massBackupProjectAction = userAction
  .schema(z.string().uuid())
  .action(
    async ({
      parsedInput,
      ctx,
    }): Promise<ServerActionResult<MassBackupProjectResult>> => {
      try {
        const project = await db.query.project.findFirst({
          where: and(
            eq(drizzleDb.schemas.project.id, parsedInput),
            eq(drizzleDb.schemas.project.isArchived, false),
          ),
        });

        if (!project) {
          return {
            success: false,
            actionError: {
              message: "Project not found or access denied.",
              messageParams: { projectId: parsedInput },
            },
          };
        }

        const membership = await db.query.member.findFirst({
          where: and(
            eq(drizzleDb.schemas.member.userId, ctx.user.id),
            eq(
              drizzleDb.schemas.member.organizationId,
              project.organizationId,
            ),
          ),
        });

        if (!membership || membership.role === "member") {
          return {
            success: false,
            actionError: {
              message: "Project not found or access denied.",
              messageParams: { projectId: parsedInput },
            },
          };
        }

        const databases = await db.query.database.findMany({
          where: eq(drizzleDb.schemas.database.projectId, parsedInput),
        });

        if (databases.length === 0) {
          return {
            success: false,
            actionError: {
              message: "No databases in this project.",
              messageParams: { projectId: parsedInput },
            },
          };
        }

        const databaseIds = databases.map((d) => d.id);

        const result = await db.transaction(async (tx) => {
          const activeBackups = await tx.query.backup.findMany({
            where: and(
              inArray(drizzleDb.schemas.backup.databaseId, databaseIds),
              inArray(drizzleDb.schemas.backup.status, ["waiting", "ongoing"]),
            ),
          });

          const busyDbIds = new Set(activeBackups.map((b) => b.databaseId));
          const toBackup = databases.filter((d) => !busyDbIds.has(d.id));

          if (toBackup.length === 0) {
            return { created: 0, skipped: databases.length };
          }

          await tx.insert(drizzleDb.schemas.backup).values(
            toBackup.map((d) => ({
              databaseId: d.id,
              status: "waiting" as const,
            })),
          );

          return {
            created: toBackup.length,
            skipped: databases.length - toBackup.length,
          };
        });

        if (result.created === 0) {
          return {
            success: false,
            actionError: {
              message:
                "All databases already have a backup in progress or waiting.",
              messageParams: { projectId: parsedInput },
            },
          };
        }

        return {
          success: true,
          value: { count: result.created, skipped: result.skipped },
          actionSuccess: {
            message:
              result.skipped > 0
                ? `Backups have been successfully created. ${result.skipped} database(s) skipped — backup already in progress.`
                : "Backups have been successfully created.",
            messageParams: {
              count: result.created,
              skipped: result.skipped,
              projectId: parsedInput,
            },
          },
        };
      } catch (error) {
        console.error("Error creating mass backup:", error);

        return {
          success: false,
          actionError: {
            message: "Failed to create backup.",
            status: 500,
            messageParams: { projectId: parsedInput },
          },
        };
      }
    },
  );
