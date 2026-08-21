import { z } from "zod";
import { EDbmsSchema } from "@/db/schema/types";

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

const PostgresOptionsSchema = z
  .object({
    keep_ownership: z.boolean().optional(),
    clean_mode: z
      .enum(["none", "clean", "drop_schemas", "drop_database"])
      .nullish(),
  })
  .optional();

export const PostgresqlConfigSchema = z.object({
  host, port, username, password, database: databaseName, options: PostgresOptionsSchema,
});
export const PostgresqlClusterConfigSchema = z.object({
  host, port, username, password,
  database: z.string().optional().default("postgres"),
  options: PostgresOptionsSchema,
});
export const MysqlConfigSchema = z.object({
  host, port, username, password, database: databaseName,
  max_packet_size: z.string().optional().default("512M"),
});
export const MariadbConfigSchema = MysqlConfigSchema;
export const MssqlConfigSchema = z.object({
  host, port, username, password, database: databaseName,
});
export const MongodbConfigSchema = z.object({
  host, port: portOptional, database: databaseName,
  username: z.string().optional(), password: z.string().optional(),
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
]);

export type DatabaseConfigFormType = z.infer<typeof DatabaseConfigFormSchema>;

export type FieldDef = {
  name: string;
  label: string;
  widget: "text" | "password" | "number" | "switch" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  clearable?: boolean;
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

export const databaseFieldDefs: Record<EDbmsSchema, FieldDef[]> = {
  postgresql: [HOST, PORT, USER, PASS, DB, KEEP_OWNERSHIP, CLEAN_MODE],
  "postgresql-cluster": [HOST, PORT, USER, PASS, f("database", "Database", "text", "defaults to postgres"), KEEP_OWNERSHIP, CLEAN_MODE],
  mysql: [HOST, PORT, USER, PASS, DB, f("max_packet_size", "Max packet size", "text", "512M")],
  mariadb: [HOST, PORT, USER, PASS, DB, f("max_packet_size", "Max packet size", "text", "512M")],
  mssql: [HOST, PORT, USER, PASS, DB],
  mongodb: [HOST, PORT_OPT, DB, USER_OPT, PASS_OPT],
  redis: [HOST, PORT, DB_OPT, USER_OPT, PASS_OPT],
  valkey: [HOST, PORT, DB_OPT, USER_OPT, PASS_OPT],
  firebird: [HOST, PORT, DB, USER_OPT, PASS_OPT],
  sqlite: [f("path", "Path *", "text", "/data/app.db"), DB_OPT],
  "docker-volume": [f("volume_name", "Volume name *", "text", "e.g. postgres_data"), f("container_name", "Container name", "text", "optional")],
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
];

export function defaultConfigFor(dbms: EDbmsSchema): Record<string, unknown> {
  switch (dbms) {
    case "postgresql":
    case "postgresql-cluster":
      return {};
    case "mysql":
    case "mariadb":
      return { max_packet_size: "512M" };
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
    if (key === "keep_ownership" && value === false) continue;
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

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function canonicalize(value: unknown): unknown {
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const inner = canonicalize(value[key]);
    if (inner === undefined || inner === null || inner === "") continue;
    if (isPlainObject(inner) && Object.keys(inner).length === 0) continue;
    out[key] = inner;
  }
  return out;
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
