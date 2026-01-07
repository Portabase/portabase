"use server"
import {getPublicServerKeyContent} from "@/features/keys/keys.action";

export async function generateEdgeKey(serverUrl: string, agentId: string): Promise<string> {
    const publicKey = getPublicServerKeyContent()
    const edgeKeyData = {
        serverUrl,
        agentId,
        publicKey
    };
    const edgeKeyJson = JSON.stringify(edgeKeyData);
    const edgeKeyBuffer = Buffer.from(edgeKeyJson, 'utf-8');
    return edgeKeyBuffer.toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function decodeEdgeKey(edgeKey: string): object {
    let edgeKeyWithPadding = edgeKey.replace(/-/g, '+').replace(/_/g, '/');
    const paddingNeeded = edgeKeyWithPadding.length % 4;
    if (paddingNeeded !== 0) {
        edgeKeyWithPadding += '='.repeat(4 - paddingNeeded);
    }
    const edgeKeyBuffer = Buffer.from(edgeKeyWithPadding, 'base64');
    const edgeKeyJson = edgeKeyBuffer.toString('utf-8');
    return JSON.parse(edgeKeyJson);
}
