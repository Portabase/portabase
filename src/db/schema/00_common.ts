import {timestamp} from "drizzle-orm/pg-core";
import {z} from "zod";

export const timestamps = {
    updatedAt: timestamp("updated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
}

export function schemaWithoutMeta<
    T extends z.ZodType
>(schema: T) {
    // @ts-ignore
    return schema.omit({id: true, createdAt: true, updatedAt: true, deletedAt: true});
}
