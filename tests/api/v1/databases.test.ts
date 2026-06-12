import { readContext } from "../helpers/context";
import { ApiHttpClient } from "../helpers/http-client";

function requireDatabaseContext() {
  const context = readContext();

  if (!context.apiKey) {
    throw new Error(
      "Authenticated database API tests require AUTH_DEFAULT_USER and AUTH_DEFAULT_PASSWORD.",
    );
  }

  if (!context.databaseId) {
    throw new Error(
      "Database API tests require a discovered database or API_TEST_DATABASE_ID.",
    );
  }

  return context;
}

describe("api v1 databases", () => {
  const context = requireDatabaseContext();
  const client = new ApiHttpClient(context.baseUrl);
  const api = client.withApiKey(context.apiKey);

  it("lists accessible databases", async () => {
    const { response, json } = await api.get("/api/v1/databases");
    expect(response.status).toBe(200);

    const payload = json as { data: Array<{ id: string }> };
    expect(Array.isArray(payload.data)).toBe(true);
    expect(
      payload.data.some((database) => database.id === context.databaseId),
    ).toBe(true);
  });

  it("returns one database by id", async () => {
    const { response, json } = await api.get(
      `/api/v1/databases/${context.databaseId}`,
    );
    expect(response.status).toBe(200);
    expect((json as { data: { id: string } }).data.id).toBe(context.databaseId);
  });

  it("returns database status", async () => {
    const { response, json } = await api.get(
      `/api/v1/databases/${context.databaseId}/status`,
    );
    expect(response.status).toBe(200);

    const data = (json as {
      data: {
        isWaitingForBackup: boolean;
        latestBackup: unknown;
        latestRestoration: unknown;
      };
    }).data;

    expect(typeof data.isWaitingForBackup).toBe("boolean");
    expect(data).toHaveProperty("latestBackup");
    expect(data).toHaveProperty("latestRestoration");
  });

  it("lists backups for the discovered database", async () => {
    const { response, json } = await api.get(
      `/api/v1/databases/${context.databaseId}/backup`,
    );
    expect(response.status).toBe(200);
    expect(Array.isArray((json as { data: unknown[] }).data)).toBe(true);
  });

  it("returns one backup with storages when backup context is available", async () => {
    if (!context.backupId) {
      throw new Error(
        "Backup detail coverage requires a discovered backup or API_TEST_BACKUP_ID.",
      );
    }

    const { response, json } = await api.get(
      `/api/v1/databases/${context.databaseId}/backup/${context.backupId}`,
    );
    expect(response.status).toBe(200);
    expect((json as { data: { id: string } }).data.id).toBe(context.backupId);
  });

  it("can trigger restore when backup and storage ids are available", async () => {
    if (!context.backupId || !context.backupStorageId) {
      throw new Error(
        "Restore coverage requires discovered backup and backup storage ids or API_TEST_BACKUP_ID/API_TEST_BACKUP_STORAGE_ID.",
      );
    }

    const { response, json } = await api.post(
      `/api/v1/databases/${context.databaseId}/restore`,
      {
        backupId: context.backupId,
        backupStorageId: context.backupStorageId,
      },
    );

    expect([201, 409]).toContain(response.status);
    if (response.status === 201) {
      expect((json as { data: { status: string } }).data.status).toBe(
        "waiting",
      );
    }
  });
});
