import { db } from "@/db";
import * as drizzleDb from "@/db";
import { and, eq, isNotNull, ne, sql } from "drizzle-orm";
import { env } from "@/env.mjs";

export async function syncApiKeyRateLimit() {
  const { apikey } = drizzleDb.schemas;

  await db
    .update(apikey)
    .set({
      refillAmount: env.API_RATE_LIMIT,
      remaining: sql`greatest(${env.API_RATE_LIMIT} - (${apikey.refillAmount} - ${apikey.remaining}), 0)`,
    })
    .where(and(eq(apikey.configId, "standard"), isNotNull(apikey.refillInterval), ne(apikey.refillAmount, env.API_RATE_LIMIT)));
}
