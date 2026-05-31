import { getServerUrl } from "@/utils/get-server-url";

export type ApiV1Result =
  | { ok: true; status: number; data: unknown }
  | { ok: false; status: number; error: string };

/**
 * Thin fetch wrapper that proxies calls to the existing /api/v1 REST layer.
 * Forwards the caller's API key so the REST route runs its own auth + permission checks.
 */
export async function apiV1Fetch(
  path: string,
  options: RequestInit,
  apiKey: string
): Promise<ApiV1Result> {
  const url = `${getServerUrl()}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        "x-api-key": apiKey,
      },
    });
  } catch {
    return { ok: false, status: 0, error: "Failed to reach internal API" };
  }

  // 204 No Content has no body
  if (res.status === 204) {
    return { ok: true, status: 204, data: null };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof (body as Record<string, unknown>).error === "string"
        ? (body as { error: string }).error
        : `Request failed with status ${res.status}`;
    return { ok: false, status: res.status, error: message };
  }

  const data =
    typeof body === "object" &&
    body !== null &&
    "data" in body
      ? (body as { data: unknown }).data
      : body;

  return { ok: true, status: res.status, data };
}
