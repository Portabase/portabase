import {pgEnum} from "drizzle-orm/pg-core";
import {createSelectSchema} from "drizzle-zod";
import {z} from "zod";

export const dbmsEnum = pgEnum("dbms_status", ["postgresql", "mysql", "mongodb"]);
export const statusEnum = pgEnum("status", ["waiting", "ongoing", "failed", "success"]);
export const typeStorageEnum = pgEnum("type_storage", ["local", "s3"]);

export const dbmsEnumSchema = createSelectSchema(dbmsEnum);
export type EDbmsSchema = z.infer<typeof dbmsEnumSchema>;

export const statusEnumSchema = createSelectSchema(statusEnum);
export type EStatusSchema = z.infer<typeof statusEnumSchema>;

export const typeStorageEnumSchema = createSelectSchema(typeStorageEnum);
export type ETypeStorageSchema = z.infer<typeof typeStorageEnumSchema>;
