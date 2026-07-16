export const DBMS_COLORS: Record<string, string> = {
  postgresql: "#3b82f6",
  mariadb: "#f97316",
  mongodb: "#22c55e",
  redis: "#ef4444",
  valkey: "#a855f7",
  firebird: "#eab308",
  mysql: "#fb923c",
  sqlite: "#6b7280",
  mssql: "#9f1239",
}

export function getDbmsColor(dbms: string): string {
  return DBMS_COLORS[dbms] ?? "#94a3b8"
}
