import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq} from "drizzle-orm";
import {logger} from "@/lib/logger";

const log = logger.child({module: "init/organization"});

export async function createDefaultOrganization() {
    const defaultOrganizationConf = {
        slug: "default",
        name: "Default Organization",
        createdAt: new Date(),
    };

    const [existing] = await db
        .select()
        .from(drizzleDb.schemas.organization)
        .where(eq(drizzleDb.schemas.organization.slug, "default"))
        .limit(1);

    if (!existing) {
        log.info("==== Creating default Organization... ====");
        await db
            .insert(drizzleDb.schemas.organization)
            .values(defaultOrganizationConf);
    }
}