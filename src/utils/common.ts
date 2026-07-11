import {
  MemberWithUser,
  Organization,
  OrganizationWithMembersAndUsers,
} from "@/db/schema/03_organization";
import { OrganizationMember } from "@/db/schema/04_member";
import { OrganizationInvitation } from "@/db/schema/05_invitation";
import { User } from "@/db/schema/02_user";

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

export function getFileExtension(dbType: string) {
  switch (dbType) {
    case "postgresql":
      return ".dump";
    case "mysql":
      return ".sql";
    default:
      return ".dump";
  }
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

export function getFileHeadersBasedOnDbms(
  dbType: string,
): Record<string, string[]> {
  let base: Record<string, string[]>;
  switch (dbType) {
    case "postgresql":
      base = { "application/octet-stream": [".dump"] };
      break;
    case "mysql":
    case "mariadb":
      base = {
        "application/sql": [".sql"],
        "application/x-sql": [".sql"],
      };
      break;
    case "mongodb":
      base = { "application/gzip": [".archive.gz"] };
      break;
    case "firebird":
      base = { "application/octet-stream": [".fbk"] };
      break;
    case "valkey":
    case "redis":
      base = { "application/octet-stream": [".rdb"] };
      break;
    case "sqlite":
      base = { "application/octet-stream": [".backup"] };
      break;
    case "mssql":
      base = { "application/octet-stream": [".bacpac"] };
      break;
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
  return mergeAccept(base, GZIP_ACCEPT);
}

/**
 * Returns a matcher for a tar entry name that indicates the archive holds a
 * valid backup for the given dbms. For postgres this covers both custom-format
 * dumps (`pg_dump -Fc` → *.dump) and directory-format dumps (`pg_dump -Fd` →
 * a `toc.dat` plus numbered data files).
 */
export function getArchiveEntryMatcher(dbType: string): RegExp {
  switch (dbType) {
    case "postgresql":
      return /(\.dump$|\.dmp$|(^|\/)toc\.dat$)/i;
    case "mysql":
    case "mariadb":
      return /\.sql$/i;
    case "mongodb":
      return /(\.archive(\.gz)?$|\.bson(\.gz)?$)/i;
    case "valkey":
    case "redis":
      return /\.rdb$/i;
    case "sqlite":
      return /(\.backup$|\.sqlite$|\.db$)/i;
    case "firebird":
      return /\.fbk$/i;
    case "mssql":
      return /\.bacpac$/i;
    default:
      throw new Error(`Unsupported database type: ${dbType}`);
  }
}
