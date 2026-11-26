export type ChainNode = {
    id: string;
    parentBackupId: string | null;
    status: string;
    createdAt: Date;
    deletedAt: Date | null;
    migrated: boolean | null;
};

export type ChainStorage = {
    backupId: string;
    storageChannelId: string;
    status: string;
    presence: string;
    deletedAt: Date | null;
};

const indexById = (nodes: ChainNode[]) => new Map(nodes.map((node) => [node.id, node]));

const walkToRoot = (nodesById: Map<string, ChainNode>, backupId: string) => {
    const path: ChainNode[] = [];
    const visited = new Set<string>();
    let broken = false;
    let currentId: string | null = backupId;
    while (currentId !== null) {
        const current = nodesById.get(currentId);
        if (!current || visited.has(currentId)) {
            broken = true;
            break;
        }
        visited.add(currentId);
        path.push(current);
        currentId = current.parentBackupId;
    }
    return { path: path.reverse(), broken };
};

export const ancestorsOf = (nodes: ChainNode[], backupId: string) => walkToRoot(indexById(nodes), backupId).path;

export type ChainGroup = { headId: string; incrementalIds: string[] };

export const chainGroups = (nodes: ChainNode[], listedIds: Set<string>): ChainGroup[] => {
    const nodesById = indexById(nodes);
    const membersByHead = new Map<string, ChainNode[]>();
    for (const listedId of listedIds) {
        const node = nodesById.get(listedId);
        if (!node) continue;
        const root = walkToRoot(nodesById, listedId).path[0];
        const headId = root && listedIds.has(root.id) ? root.id : listedId;
        membersByHead.set(headId, [...(membersByHead.get(headId) ?? []), node]);
    }
    const newestFirst = (first: ChainNode, second: ChainNode) => second.createdAt.getTime() - first.createdAt.getTime();
    return [...membersByHead]
        .map(([headId, members]) => ({ headId, members: members.sort(newestFirst) }))
        .sort((first, second) => newestFirst(first.members[0], second.members[0]))
        .map(({ headId, members }) => ({
            headId,
            incrementalIds: members.filter((member) => member.id !== headId).map((member) => member.id).reverse(),
        }));
};

export const descendantIdsOf = (nodes: ChainNode[], backupId: string) => {
    const liveNodes = nodes.filter((node) => node.deletedAt === null);
    const levels: string[][] = [];
    const seen = new Set([backupId]);
    let frontier = [backupId];
    while (frontier.length > 0) {
        const children = liveNodes
            .filter((node) => node.parentBackupId !== null && frontier.includes(node.parentBackupId) && !seen.has(node.id))
            .map((node) => node.id);
        for (const childId of children) seen.add(childId);
        if (children.length > 0) levels.push(children);
        frontier = children;
    }
    return levels.reverse().flat();
};

export const deletableAfterRetention = (nodes: ChainNode[], expiredIds: string[]) => {
    const nodesById = indexById(nodes);
    const expired = new Set(expiredIds);
    const protectedIds = new Set<string>();
    for (const node of nodes) {
        const inFlight = node.status === "ongoing" || node.status === "waiting";
        if (node.deletedAt !== null || (expired.has(node.id) && !inFlight)) continue;
        const visited = new Set<string>();
        let current = nodesById.get(node.id);
        while (current && !protectedIds.has(current.id) && !visited.has(current.id)) {
            visited.add(current.id);
            protectedIds.add(current.id);
            current = current.parentBackupId === null ? undefined : nodesById.get(current.parentBackupId);
        }
    }
    return expiredIds.filter((backupId) => !protectedIds.has(backupId));
};

const liveCopyKeys = (storages: ChainStorage[]) =>
    new Set(
        storages
            .filter((storage) => storage.deletedAt === null && storage.status === "success" && storage.presence !== "missing")
            .map((storage) => `${storage.backupId}|${storage.storageChannelId}`),
    );

export const missingLinkOnChannel = (nodes: ChainNode[], storages: ChainStorage[], backupId: string, channelId: string) => {
    const copyKeys = liveCopyKeys(storages);
    const { path, broken } = walkToRoot(indexById(nodes), backupId);
    const lacking = path.find((node) => !copyKeys.has(`${node.id}|${channelId}`));
    if (lacking) return lacking;
    if (broken) return path.length > 0 ? path[0] : null;
    return null;
};

export const migrationChainIds = (nodes: ChainNode[], storages: ChainStorage[], backupIds: string[]) => {
    const chainIds = new Set<string>();
    for (const backupId of backupIds) {
        const path = ancestorsOf(nodes, backupId);
        const usable = path.length > 0 && path.every((node) => node.deletedAt === null && node.status === "success");
        const restorable = storages.some((storage) =>
            storage.backupId === backupId
            && storage.deletedAt === null
            && storage.status === "success"
            && missingLinkOnChannel(nodes, storages, backupId, storage.storageChannelId) === null);
        if (!usable || !restorable) return null;
        for (const node of path) chainIds.add(node.id);
    }
    return [...chainIds];
};

export const eligibleParent = (nodes: ChainNode[], storages: ChainStorage[], channelIds: string[]) => {
    if (channelIds.length === 0) return null;
    const nodesById = indexById(nodes);
    const copyKeys = liveCopyKeys(storages);
    const chainOk = new Map<string, boolean>();
    const resolveChainOk = (startId: string) => {
        const pending: ChainNode[] = [];
        const visiting = new Set<string>();
        let currentId: string | null = startId;
        let result = true;
        while (currentId !== null) {
            const known = chainOk.get(currentId);
            if (known !== undefined) {
                result = known;
                break;
            }
            const current = nodesById.get(currentId);
            if (!current || visiting.has(currentId)) {
                result = false;
                break;
            }
            visiting.add(currentId);
            pending.push(current);
            currentId = current.parentBackupId;
        }
        for (let index = pending.length - 1; index >= 0; index--) {
            const link = pending[index];
            result = result && channelIds.every((channelId) => copyKeys.has(`${link.id}|${channelId}`));
            chainOk.set(link.id, result);
        }
        return chainOk.get(startId) ?? false;
    };
    const candidates = nodes
        .filter((node) => node.deletedAt === null && node.status === "success" && !node.migrated)
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    return candidates.find((candidate) => resolveChainOk(candidate.id)) ?? null;
};
