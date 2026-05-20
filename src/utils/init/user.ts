import {db} from "@/db";
import * as drizzleDb from "@/db";
import {count, eq} from "drizzle-orm";
import {logger} from "@/lib/logger";
import type { SignUpUser } from "@/types/auth";
import {env} from "@/env.mjs";
import {createUserDb} from "@/db/services/user";

const log = logger.child({module: "init/user"});

export async function createDefaultUser() {

    const hasRequiredEnv =
        env.AUTH_DEFAULT_USER &&
        env.AUTH_DEFAULT_PASSWORD &&
        env.AUTH_DEFAULT_USER_NAME;

    if (!hasRequiredEnv) {
        log.info(
            "Default admin creation skipped: missing environment variables.",
        );
        return;
    }

    log.info("Checking default super admin...");

    const existingSuperAdmin = await db.query.user.findFirst({
        where: eq(drizzleDb.schemas.user.role, "superadmin"),
    });

    if (existingSuperAdmin) {
        log.info(
            `CreateDefaultUser skipped: a superadmin already exists (${existingSuperAdmin.email}).`,
        );
        return;
    }

    const userData: SignUpUser = {
        name: env.AUTH_DEFAULT_USER_NAME!,
        email: env.AUTH_DEFAULT_USER!,
        password: env.AUTH_DEFAULT_PASSWORD!,
        theme: "system",
        role: "superadmin",
        emailVerified: true,
    };


    const newUser = await createUserDb(userData);

    if (newUser) {
        log.info(`Default super admin created (${userData.email}).`);

        const defaultOrgSlug = "default";
        const defaultOrg = await db.query.organization.findFirst({
            where: eq(drizzleDb.schemas.organization.slug, defaultOrgSlug),
        });

        if (defaultOrg) {
            await db.insert(drizzleDb.schemas.member).values({
                userId: newUser.id,
                organizationId: defaultOrg.id,
                role: "owner",
            });
        } else {
            log.warn(
                "Default organization not found. Cannot assign member.",
            );
        }

    }
}
