type JsonValue =
  | Record<string, unknown>
  | Array<unknown>
  | string
  | number
  | boolean
  | null;

function mergeCookieHeaders(
  currentCookieHeader: string,
  setCookies: string[],
): string {
  const cookies = new Map<string, string>();

  for (const value of currentCookieHeader.split("; ")) {
    if (!value) {
      continue;
    }

    const [name, ...rest] = value.split("=");
    cookies.set(name, rest.join("="));
  }

  for (const value of setCookies) {
    const [cookiePair] = value.split(";");
    const [name, ...rest] = cookiePair.split("=");
    cookies.set(name, rest.join("="));
  }

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export class ApiHttpClient {
  constructor(
    private readonly baseUrl: string,
    private cookieHeader = "",
  ) {}

  getCookieHeader() {
    return this.cookieHeader;
  }

  withApiKey(apiKey: string) {
    return {
      get: (path: string) =>
        this.request("GET", path, undefined, { "x-api-key": apiKey }),
      post: (path: string, body?: JsonValue) =>
        this.request("POST", path, body, { "x-api-key": apiKey }),
      patch: (path: string, body?: JsonValue) =>
        this.request("PATCH", path, body, { "x-api-key": apiKey }),
      delete: (path: string) =>
        this.request("DELETE", path, undefined, { "x-api-key": apiKey }),
    };
  }

  async request(
    method: string,
    path: string,
    body?: JsonValue,
    headers: HeadersInit = {},
  ) {
    const requestHeaders = new Headers({
      origin: new URL(this.baseUrl).origin,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(this.cookieHeader ? { cookie: this.cookieHeader } : {}),
    });

    new Headers(headers).forEach((value, name) => {
      requestHeaders.set(name, value);
    });

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: requestHeaders,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      this.cookieHeader = mergeCookieHeaders(this.cookieHeader, setCookies);
    }

    const text = await response.text();
    let json: unknown = null;

    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = text;
      }
    }

    return { response, json, text };
  }
}
