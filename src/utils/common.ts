import {
  MemberWithUser,
  Organization,
  OrganizationWithMembersAndUsers,
} from "@/db/schema/03_organization";
import { OrganizationMember } from "@/db/schema/04_member";
import { OrganizationInvitation } from "@/db/schema/05_invitation";
import { User } from "@/db/schema/02_user";
import { EDbmsSchema } from "@/db/schema/types";

export function buildOrganizationWithMembers(
  rows: {
    organization: Organization;
    member: OrganizationMember | null;
    invitation: OrganizationInvitation | null;
    user: User | null;
  }[],
): OrganizationWithMembersAndUsers | null {
  if (rows.length === 0) return null;

  const org = rows[0].organization;

  const invitations: OrganizationInvitation[] = rows
    .filter((r) => r.invitation)
    .map((r) => ({
      ...r.invitation!,
    }));

  const members: MemberWithUser[] = rows
    .filter((r) => r.member && r.user)
    .map((r) => ({
      ...r.member!,
      user: r.user!,
    }));

  return {
    ...org,
    invitations,
    members,
  };
}

type BackupFileMeta = {
  extension: string;
  accept: Record<string, string[]>;
  archiveMatcher: RegExp;
};

export const BACKUP_FILE_META: Record<EDbmsSchema, BackupFileMeta> = {
  postgresql: {
    extension: ".dump",
    accept: { "application/octet-stream": [".dump"] },
    archiveMatcher: /(\.dump$|\.dmp$|(^|\/)toc\.dat$)/i,
  },
  "postgresql-cluster": {
    extension: ".dump",
    accept: { "application/octet-stream": [".dump"] },
    archiveMatcher: /(\.dump$|\.dmp$|(^|\/)toc\.dat$)/i,
  },
  mysql: {
    extension: ".sql",
    accept: { "application/sql": [".sql"], "application/x-sql": [".sql"] },
    archiveMatcher: /\.sql$/i,
  },
  mariadb: {
    extension: ".sql",
    accept: { "application/sql": [".sql"], "application/x-sql": [".sql"] },
    archiveMatcher: /\.sql$/i,
  },
  mssql: {
    extension: ".bacpac",
    accept: { "application/octet-stream": [".bacpac", ".dacpac"] },
    archiveMatcher: /\.(bacpac|dacpac)$/i,
  },
  mongodb: {
    extension: ".archive.gz",
    accept: { "application/gzip": [".archive.gz"] },
    archiveMatcher: /(\.archive(\.gz)?$|\.bson(\.gz)?$)/i,
  },
  redis: {
    extension: ".rdb",
    accept: { "application/octet-stream": [".rdb"] },
    archiveMatcher: /\.rdb$/i,
  },
  valkey: {
    extension: ".rdb",
    accept: { "application/octet-stream": [".rdb"] },
    archiveMatcher: /\.rdb$/i,
  },
  firebird: {
    extension: ".fbk",
    accept: { "application/octet-stream": [".fbk"] },
    archiveMatcher: /\.fbk$/i,
  },
  sqlite: {
    extension: ".backup",
    accept: { "application/octet-stream": [".backup"] },
    archiveMatcher: /(\.backup$|\.sqlite$|\.db$)/i,
  },
  "docker-volume": {
    extension: ".tar.gz",
    accept: { "application/gzip": [".tar.gz", ".tgz"] },
    archiveMatcher: /\.(tar\.gz|tgz)$/i,
  },
  // TODO: confirm format once the agent's Db2 backup output is settled.
  db2: {
    extension: ".dump",
    accept: { "application/octet-stream": [".dump"] },
    archiveMatcher: /(\.dump$|\.001$)/i,
  },
};

/** Default backup file extension for an engine, defaulting to `.dump`. */
export function getFileExtension(dbType: string) {
  return BACKUP_FILE_META[dbType as EDbmsSchema]?.extension ?? ".dump";
}

const GZIP_ACCEPT: Record<string, string[]> = {
  "application/gzip": [".tar.gz", ".tgz"],
  "application/x-gzip": [".tar.gz", ".tgz"],
};

function mergeAccept(
  base: Record<string, string[]>,
  extra: Record<string, string[]>,
): Record<string, string[]> {
  const out: Record<string, string[]> = { ...base };
  for (const [mime, exts] of Object.entries(extra)) {
    out[mime] = Array.from(new Set([...(out[mime] ?? []), ...exts]));
  }
  return out;
}

/** Accepted upload MIME/extension map for an engine, merged with gzip variants. */
export function getFileHeadersBasedOnDbms(
  dbType: string,
): Record<string, string[]> {
  const meta = BACKUP_FILE_META[dbType as EDbmsSchema] as
    | BackupFileMeta
    | undefined;
  if (!meta) throw new Error(`Unsupported database type: ${dbType}`);
  return mergeAccept(meta.accept, GZIP_ACCEPT);
}

/** Matches the backup entry inside an uploaded archive for an engine. */
export function getArchiveEntryMatcher(dbType: string): RegExp {
  const meta = BACKUP_FILE_META[dbType as EDbmsSchema] as
    | BackupFileMeta
    | undefined;
  if (!meta) throw new Error(`Unsupported database type: ${dbType}`);
  return meta.archiveMatcher;
}
