import {EDbmsSchema} from "@/db/schema/types";

export const MASKED_SECRET = "********";

export const DB_SECRET_FIELDS: Record<EDbmsSchema, string[]> = {
    postgresql: ["password"],
    "postgresql-cluster": ["password"],
    mysql: ["password"],
    mariadb: ["password"],
    mssql: ["password"],
    mongodb: ["password"],
    redis: ["password"],
    valkey: ["password"],
    firebird: ["password"],
    sqlite: [],
    "docker-volume": [],
};

type Config = Record<string, unknown> | null | undefined;

const hasValue = (v: unknown): boolean =>
    v != null && !(typeof v === "string" && v.length === 0);

export function maskConfigForDashboard(dbms: EDbmsSchema, config: Config): Config {
    if (!config) return config;
    const secretFields = DB_SECRET_FIELDS[dbms] ?? [];
    if (secretFields.length === 0) return config;

    let out: Record<string, unknown> | null = null;
    for (const field of secretFields) {
        if (hasValue(config[field])) {
            out ??= {...config};
            out[field] = MASKED_SECRET;
        }
    }
    return out ?? config;
}

type DbLike = { dbms: EDbmsSchema; config: Config };

export function maskDatabaseSecretsForClient<T extends DbLike>(db: T): T {
    return {...db, config: maskConfigForDashboard(db.dbms, db.config)};
}

export function maskDatabasesSecretsForClient<T extends DbLike>(dbs: T[]): T[] {
    return dbs.map(maskDatabaseSecretsForClient);
}
