import "server-only";

import {AsyncLocalStorage} from "node:async_hooks";
import type {Agent} from "node:http";
import {ProxyAgent as NodeProxyAgent} from "proxy-agent";
import {
    fetch as undiciFetch,
    ProxyAgent as UndiciProxyAgent,
    type RequestInit,
} from "undici";

const proxyContext = new AsyncLocalStorage<string | undefined>();
const nodeAgents = new Map<string, Agent>();
const fetchAgents = new Map<string, UndiciProxyAgent>();

export const runWithHttpProxy = <T>(
    proxyUrl: string | null | undefined,
    callback: () => T,
): T => proxyContext.run(proxyUrl || undefined, callback);

export const getHttpProxy = () => proxyContext.getStore();

export const getNodeProxyAgent = (): Agent | undefined => {
    const proxyUrl = getHttpProxy();
    if (!proxyUrl) return undefined;

    const cached = nodeAgents.get(proxyUrl);
    if (cached) return cached;

    const agent = new NodeProxyAgent({getProxyForUrl: () => proxyUrl});
    nodeAgents.set(proxyUrl, agent);
    return agent;
};

export const fetchWithHttpProxy = (
    input: string | URL,
    init?: RequestInit,
    explicitProxyUrl?: string | null,
) => {
    const proxyUrl = explicitProxyUrl || getHttpProxy();
    if (!proxyUrl) return undiciFetch(input, init);

    let dispatcher = fetchAgents.get(proxyUrl);
    if (!dispatcher) {
        dispatcher = new UndiciProxyAgent(proxyUrl);
        fetchAgents.set(proxyUrl, dispatcher);
    }

    return undiciFetch(input, {...init, dispatcher});
};

export const getAzureProxyOptions = () => {
    const proxyUrl = getHttpProxy();
    if (!proxyUrl) return undefined;

    const url = new URL(proxyUrl);
    return {
        host: url.protocol + "//" + url.hostname,
        port: Number(url.port || (url.protocol === "https:" ? 443 : 80)),
        username: url.username ? decodeURIComponent(url.username) : undefined,
        password: url.password ? decodeURIComponent(url.password) : undefined,
    };
};
