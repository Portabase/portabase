"use server"
import {getMasterServerKeyContent} from "@/features/keys/keys.action";

export async function generateEdgeKey(serverUrl: string, agentId: string): Promise<string> {
    const masterKey = await getMasterServerKeyContent()
    const edgeKeyData = {
        serverUrl,
        agentId,
        masterKeyB64: masterKey.toString('base64')
    };
    const edgeKeyJson = JSON.stringify(edgeKeyData);
    return Buffer.from(edgeKeyJson, 'utf-8').toString('base64');
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
