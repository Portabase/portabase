import { z } from "zod";
import { EDbmsSchema } from "@/db/schema/types";
import { canonicalize } from "@/lib/utils";

const req = (label: string) =>
  z.string({ error: `${label} is required` }).min(1, `${label} is required`);

const host = req("Host");
const port = z.coerce
  .number({ error: "Port is required" })
  .int("Port must be a whole number")
  .min(1, "Port must be >= 1")
  .max(65535, "Port must be <= 65535");
const portOptional = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce
    .number()
    .int("Port must be a whole number")
    .min(1, "Port must be >= 1")
    .max(65535, "Port must be <= 65535")
    .optional(),
);
const username = req("Username");
const password = req("Password");
const databaseName = req("Database");

const PostgresOptionsBase = z.object({
  keep_ownership: z.boolean().optional(),
  clean_mode: z
    .enum(["none", "clean", "drop_schemas", "drop_database"])
    .nullish(),
});

export const PostgresqlConfigSchema = z.object({
  host, port, username, password, database: databaseName,
  options: PostgresOptionsBase.extend({
    exclude_tables: z.array(z.string()).optional(),
    exclude_schemas: z.array(z.string()).optional(),
  }).optional(),
});
export const PostgresqlClusterConfigSchema = z.object({
  host, port, username, password,
  database: z.string().optional().default("postgres"),
  options: PostgresOptionsBase.optional(),
});
export const MysqlConfigSchema = z.object({
  host, port, username, password, database: databaseName,
  max_packet_size: z.string().optional().default("512M"),
});
export const MariadbConfigSchema = MysqlConfigSchema;
const MssqlOptionsSchema = z
  .object({
    backup_format: z.enum(["dacpac", "bacpac"]).nullish(),
  })
  .optional();

export const MssqlConfigSchema = z.object({
  host, port, username, password, database: databaseName, options: MssqlOptionsSchema,
});
const MongoOptionsSchema = z
  .object({
    auth_source: z.string().optional(),
    replica_set: z.string().optional(),
    tls: z.boolean().optional(),
  })
  .optional();

export const MongodbConfigSchema = z.object({
  host, port: portOptional, database: databaseName,
  username: z.string().optional(), password: z.string().optional(),
  options: MongoOptionsSchema,
});
export const RedisConfigSchema = z.object({
  host, port,
  database: z.string().optional(),
  username: z.string().optional(), password: z.string().optional(),
});
export const ValkeyConfigSchema = RedisConfigSchema;
export const FirebirdConfigSchema = z.object({
  host, port, database: databaseName,
  username: z.string().optional(), password: z.string().optional(),
});
export const SqliteConfigSchema = z.object({
  path: req("Path"),
  database: z.string().optional(),
});
export const DockerVolumeConfigSchema = z.object({
  volume_name: req("Volume name"),
  container_name: z.string().optional(),
});
export const FilesConfigSchema = z.object({
  path: req("Path").refine(
    (p) => p.startsWith("/") && p.replace(/\/+$/, "") !== "",
    "Path must be absolute and not /",
  ),
  options: z
    .object({
      exclude: z.array(z.string()).optional(),
      one_file_system: z.boolean().optional(),
      method: z.enum(["archive", "snapshot", "sync", "copy"]).optional(),
    })
    .optional(),
});

const BaseDb = z.object({
  name: req("Name").max(255),
});

export const DatabaseConfigFormSchema = z.discriminatedUnion("dbms", [
  BaseDb.extend({ dbms: z.literal("postgresql"), config: PostgresqlConfigSchema }),
  BaseDb.extend({ dbms: z.literal("postgresql-cluster"), config: PostgresqlClusterConfigSchema }),
  BaseDb.extend({ dbms: z.literal("mysql"), config: MysqlConfigSchema }),
  BaseDb.extend({ dbms: z.literal("mariadb"), config: MariadbConfigSchema }),
  BaseDb.extend({ dbms: z.literal("mssql"), config: MssqlConfigSchema }),
  BaseDb.extend({ dbms: z.literal("mongodb"), config: MongodbConfigSchema }),
  BaseDb.extend({ dbms: z.literal("redis"), config: RedisConfigSchema }),
  BaseDb.extend({ dbms: z.literal("valkey"), config: ValkeyConfigSchema }),
  BaseDb.extend({ dbms: z.literal("firebird"), config: FirebirdConfigSchema }),
  BaseDb.extend({ dbms: z.literal("sqlite"), config: SqliteConfigSchema }),
  BaseDb.extend({ dbms: z.literal("docker-volume"), config: DockerVolumeConfigSchema }),
  BaseDb.extend({ dbms: z.literal("files"), config: FilesConfigSchema }),
]);

export type DatabaseConfigFormType = z.infer<typeof DatabaseConfigFormSchema>;

export type FieldDef = {
  name: string;
  label: string;
  widget: "text" | "password" | "number" | "switch" | "select" | "lines";
  placeholder?: string;
  options?: { value: string; label: string }[];
  clearable?: boolean;
  description?: string;
  lockedOnEdit?: boolean;
};

const f = (name: string, label: string, widget: FieldDef["widget"], placeholder?: string, options?: FieldDef["options"]): FieldDef =>
  ({ name: `config.${name}`, label, widget, placeholder, options });

const HOST = f("host", "Host *", "text", "e.g. postgres");
const PORT = f("port", "Port *", "number", "e.g. 5432");
const PORT_OPT = f("port", "Port", "number", "e.g. 27017");
const USER = f("username", "Username *", "text", "e.g. postgres");
const USER_OPT = f("username", "Username", "text", "optional");
const PASS = f("password", "Password *", "password", "••••••••");
const PASS_OPT = f("password", "Password", "password", "optional");
const DB = f("database", "Database *", "text", "e.g. app_db");
const DB_OPT = f("database", "Database", "text", "optional");
const KEEP_OWNERSHIP = f("options.keep_ownership", "Keep ownership", "switch");
const CLEAN_MODE: FieldDef = {
  ...f("options.clean_mode", "Clean mode", "select", undefined, [
    { value: "none", label: "none" },
    { value: "clean", label: "clean (agent default)" },
    { value: "drop_schemas", label: "drop_schemas" },
    { value: "drop_database", label: "drop_database" },
  ]),
  clearable: true,
};
const EXCLUDE_TABLES: FieldDef = {
  ...f("options.exclude_tables", "Exclude tables", "lines", "public.search_index__*"),
  description:
    "One pg_dump pattern per line (--exclude-table). Excluded tables are dropped on restore with drop_schemas or drop_database.",
};
const EXCLUDE_SCHEMAS: FieldDef = {
  ...f("options.exclude_schemas", "Exclude schemas", "lines", "metabase_tmp"),
  description:
    "One pg_dump pattern per line (--exclude-schema). Excluded schemas are dropped on restore with drop_schemas or drop_database.",
};
const BACKUP_FORMAT: FieldDef = {
  ...f("options.backup_format", "Backup format", "select", undefined, [
    { value: "dacpac", label: "dacpac (agent default)" },
    { value: "bacpac", label: "bacpac" },
  ]),
  clearable: true,
};

export const databaseFieldDefs: Record<EDbmsSchema, FieldDef[]> = {
  postgresql: [HOST, PORT, USER, PASS, DB, KEEP_OWNERSHIP, CLEAN_MODE, EXCLUDE_TABLES, EXCLUDE_SCHEMAS],
  "postgresql-cluster": [HOST, PORT, USER, PASS, f("database", "Database", "text", "defaults to postgres"), KEEP_OWNERSHIP, CLEAN_MODE],
  mysql: [HOST, PORT, USER, PASS, DB, f("max_packet_size", "Max packet size", "text", "512M")],
  mariadb: [HOST, PORT, USER, PASS, DB, f("max_packet_size", "Max packet size", "text", "512M")],
  mssql: [HOST, PORT, USER, PASS, DB, BACKUP_FORMAT],
  mongodb: [
    {
      ...HOST,
      description:
        "Single host, or a comma-separated replica-set list (host1:port1,host2:port2,host3:port3). With a list, leave Port empty.",
    },
    PORT_OPT, DB, USER_OPT, PASS_OPT,
    f("options.auth_source", "Auth source", "text", "defaults to admin"),
    f("options.replica_set", "Replica set", "text", "optional"),
    f("options.tls", "TLS", "switch"),
  ],
  redis: [HOST, PORT, DB_OPT, USER_OPT, PASS_OPT],
  valkey: [HOST, PORT, DB_OPT, USER_OPT, PASS_OPT],
  firebird: [HOST, PORT, DB, USER_OPT, PASS_OPT],
  sqlite: [f("path", "Path *", "text", "/data/app.db"), DB_OPT],
  "docker-volume": [f("volume_name", "Volume name *", "text", "e.g. postgres_data"), f("container_name", "Container name", "text", "optional")],
  files: [
    f("path", "Path *", "text", "/data/files"),
    {
      ...f("options.method", "Method *", "select", undefined, [
        { value: "archive", label: "Archive (tar)" },
        { value: "snapshot", label: "Snapshots" },
        { value: "sync", label: "Sync" },
        { value: "copy", label: "Copy" },
      ]),
      lockedOnEdit: true,
      description:
        "Archive: one tar(.gz) file per run. Snapshots: incremental, deduplicated restic history. " +
        "Sync: a mirror of the directory on each storage; deletions and ransomware propagate, keep Archive or Snapshots for history. " +
        "Copy: like Sync, but files removed from the source are kept on the storage. " +
        "Set at creation; it cannot be changed afterwards.",
    },
    {
      ...f("options.exclude", "Exclude", "lines", "node_modules\n*.tmp\n/cache"),
      description:
        "One pattern per line. Without a leading / it matches at any depth; with a leading / it is relative to Path. " +
        "With Sync, files matching a pattern are deleted from the replica on the next run; with Copy they stay.",
    },
    f("options.one_file_system", "Stay on one file system", "switch"),
  ],
};

export const databaseTypeOptions: { value: EDbmsSchema; label: string }[] = [
  { value: "postgresql", label: "PostgreSQL" },
  { value: "postgresql-cluster", label: "PostgreSQL Cluster" },
  { value: "mysql", label: "MySQL" },
  { value: "mariadb", label: "MariaDB" },
  { value: "mssql", label: "MSSQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "redis", label: "Redis" },
  { value: "valkey", label: "Valkey" },
  { value: "firebird", label: "Firebird" },
  { value: "sqlite", label: "SQLite" },
  { value: "docker-volume", label: "Docker Volume" },
  { value: "files", label: "Files" },
];

export function defaultConfigFor(dbms: EDbmsSchema): Record<string, unknown> {
  switch (dbms) {
    case "postgresql":
    case "postgresql-cluster":
      return {};
    case "mysql":
    case "mariadb":
      return { max_packet_size: "512M" };
    case "files":
      return { path: "", options: { exclude: [], one_file_system: false, method: "archive" } };
    default:
      return {};
  }
}

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type AgentConfigFormShape = {
  name: string;
  dbms: EDbmsSchema;
  config: Record<string, unknown>;
};


export function pruneAgentConfig(
  config: Record<string, unknown> | undefined | null,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(config ?? {}) };
  if (!("options" in out)) return out;

  const options = out.options;
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    delete out.options;
    return out;
  }

  const kept: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    if (value === false) continue; // default-off switches (keep_ownership, tls) ship nothing
    if (Array.isArray(value)) {
      const items = value
        .map((v) => (typeof v === "string" ? v.trim() : v))
        .filter((v) => v !== "" && v !== null && v !== undefined);
      if (items.length > 0) kept[key] = items;
      continue;
    }
    kept[key] = value;
  }

  if (Object.keys(kept).length > 0) out.options = kept;
  else delete out.options;
  return out;
}

export function toAgentConfigJson(
  values: { name?: string; dbms?: EDbmsSchema; config?: Record<string, unknown> },
  generatedId?: string,
): Record<string, unknown> {
  return {
    name: values.name ?? "",
    type: values.dbms,
    ...pruneAgentConfig(values.config),
    ...(generatedId ? { generated_id: generatedId } : {}),
  };
}

export function agentConfigSignature(
  values: { name?: string; dbms?: EDbmsSchema; config?: Record<string, unknown> },
  generatedId?: string,
): string {
  const parsed = DatabaseConfigFormSchema.safeParse(values);
  const source = parsed.success ? (parsed.data as typeof values) : values;
  return JSON.stringify(canonicalize(toAgentConfigJson(source, generatedId)));
}

export function fromAgentConfigJson(obj: Record<string, unknown>): {
  form: AgentConfigFormShape;
  generatedId?: string;
} {
  const { name, type, generated_id, ...rest } = obj as Record<string, unknown>;
  return {
    form: {
      name: typeof name === "string" ? name : "",
      dbms: type as EDbmsSchema,
      config: rest,
    },
    generatedId: typeof generated_id === "string" ? generated_id : undefined,
  };
}
