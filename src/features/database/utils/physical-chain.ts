export type ChainNode = {
    id: string;
    parentBackupId: string | null;
    status: string;
    createdAt: Date;
    deletedAt: Date | null;
};

export type ChainStorage = {
    backupId: string;
    storageChannelId: string;
    status: string;
    presence: string;
    deletedAt: Date | null;
};

const walkToRoot = (nodes: ChainNode[], backupId: string) => {
    const nodesById = new Map(nodes.map((node) => [node.id, node]));
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

export const ancestorsOf = (nodes: ChainNode[], backupId: string) => walkToRoot(nodes, backupId).path;

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
    const expired = new Set(expiredIds);
    const protectedIds = new Set<string>();
    for (const node of nodes) {
        const inFlight = node.status === "ongoing" || node.status === "waiting";
        if (node.deletedAt !== null || (expired.has(node.id) && !inFlight)) continue;
        for (const ancestor of ancestorsOf(nodes, node.id)) protectedIds.add(ancestor.id);
    }
    return expiredIds.filter((backupId) => !protectedIds.has(backupId));
};

const hasLiveCopy = (storages: ChainStorage[], backupId: string, channelId: string) =>
    storages.some(
        (storage) =>
            storage.backupId === backupId &&
            storage.storageChannelId === channelId &&
            storage.deletedAt === null &&
            storage.status === "success" &&
            storage.presence !== "missing",
    );

export const missingLinkOnChannel = (nodes: ChainNode[], storages: ChainStorage[], backupId: string, channelId: string) => {
    const { path, broken } = walkToRoot(nodes, backupId);
    const lacking = path.find((node) => !hasLiveCopy(storages, node.id, channelId));
    if (lacking) return lacking;
    if (broken) return path.length > 0 ? path[0] : null;
    return null;
};

export const eligibleParent = (nodes: ChainNode[], storages: ChainStorage[], channelIds: string[]) => {
    if (channelIds.length === 0) return null;
    const candidates = nodes
        .filter((node) => node.deletedAt === null && node.status === "success")
        .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
    return (
        candidates.find((candidate) => {
            const { path, broken } = walkToRoot(nodes, candidate.id);
            if (broken) return false;
            return channelIds.every((channelId) => path.every((link) => hasLiveCopy(storages, link.id, channelId)));
        }) ?? null
    );
};
