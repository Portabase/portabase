function readIdArray(json: unknown, resourceName: string): Array<{ id: string }> {
  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new Error(`Invalid ${resourceName} response: missing data array`);
  }

  const data = (json as { data?: unknown }).data;
  if (!Array.isArray(data)) {
    throw new Error(`Invalid ${resourceName} response: data is not an array`);
  }

  for (const item of data) {
    if (!item || typeof item !== "object" || typeof (item as { id?: unknown }).id !== "string") {
      throw new Error(
        `Invalid ${resourceName} response: each item must include a string id`,
      );
    }
  }

  return data as Array<{ id: string }>;
}

function readBackupDetail(json: unknown) {
  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new Error("Invalid backup detail response: missing data object");
  }

  const data = (json as { data?: unknown }).data;
  if (!data || typeof data !== "object") {
    throw new Error("Invalid backup detail response: data is not an object");
  }

  const id = (data as { id?: unknown }).id;
  const storages = (data as { storages?: unknown }).storages;

  if (typeof id !== "string") {
    throw new Error("Invalid backup detail response: data.id must be a string");
  }

  if (!Array.isArray(storages)) {
    throw new Error(
      "Invalid backup detail response: data.storages is not an array",
    );
  }

  for (const item of storages) {
    if (
      !item ||
      typeof item !== "object" ||
      typeof (item as { id?: unknown }).id !== "string" ||
      typeof (item as { status?: unknown }).status !== "string"
    ) {
      throw new Error(
        "Invalid backup detail response: each storage must include string id and status",
      );
    }
  }

  return {
    id,
    storages: storages as Array<{ id: string; status: string }>,
  };
}

export async function discoverAgentId(api: {
  get: (path: string) => Promise<{ response: Response; json: unknown; text: string }>;
}) {
  const result = await api.get("/api/v1/agents");
  if (!result.response.ok) {
    throw new Error(`Failed to list agents: ${result.response.status} ${result.text}`);
  }

  const agents = readIdArray(result.json, "agents");
  if (agents.length === 0) {
    throw new Error("No agent could be discovered from /api/v1/agents.");
  }

  return agents[0].id;
}

export async function discoverDatabaseId(api: {
  get: (path: string) => Promise<{ response: Response; json: unknown; text: string }>;
}) {
  const result = await api.get("/api/v1/databases");
  if (!result.response.ok) {
    throw new Error(
      `Failed to list databases: ${result.response.status} ${result.text}`,
    );
  }

  const databases = readIdArray(result.json, "databases");
  if (databases.length === 0) {
    throw new Error("No database could be discovered from /api/v1/databases.");
  }

  return databases[0].id;
}

export async function discoverBackupContext(
  api: {
    get: (path: string) => Promise<{ response: Response; json: unknown; text: string }>;
  },
  databaseId: string | null,
) {
  if (!databaseId) {
    throw new Error("Backup discovery requires a database id.");
  }

  const backups = await api.get(`/api/v1/databases/${databaseId}/backup`);
  if (!backups.response.ok) {
    throw new Error(
      `Failed to list backups: ${backups.response.status} ${backups.text}`,
    );
  }

  const backupList = readIdArray(backups.json, "backups");
  for (const backup of backupList) {
    const detail = await api.get(`/api/v1/databases/${databaseId}/backup/${backup.id}`);
    if (!detail.response.ok) {
      continue;
    }

    const payload = readBackupDetail(detail.json);
    const storage = payload.storages.find((item) => item.status === "success");
    if (storage) {
      return {
        backupId: payload.id,
        backupStorageId: storage.id,
      };
    }
  }

  throw new Error(
    `No successful backup storage could be discovered for database ${databaseId}.`,
  );
}
