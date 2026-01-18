import {NextResponse} from "next/server";
import path from "path";
import {db} from "@/db";
import {eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import type {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/dispatch";
import {Readable} from "node:stream";

export async function GET(
    request: Request,
) {

    const {searchParams} = new URL(request.url);
    const token = searchParams.get('token');
    const expires = searchParams.get('expires');
    const pathFromUrl = searchParams.get('path');

    if (!pathFromUrl) {
        return NextResponse.json({error: "Missing file path in search params"}, {status: 404})
    }

    const localStorageChannel = await db.query.storageChannel.findFirst({
        where: eq(drizzleDb.schemas.storageChannel.provider, "local"),
    })

    if (!localStorageChannel) {
        return NextResponse.json({error: "No local storage channel found"})
    }

    const input: StorageInput = {
        action: "get",
        data: {
            path: pathFromUrl,
            signedUrl: true,
        },
    };

    console.debug(input);

    const result = await dispatchStorage(input, undefined, localStorageChannel.id);

    if (!result.success) {
        return NextResponse.json({error: "Enable to get file from local storage channel, an error occurred !"})
    }


    const fileName = path.basename(pathFromUrl);

    const crypto = require('crypto');
    const expectedToken = crypto.createHash('sha256').update(`${fileName}${expires}`).digest('hex');
    if (token !== expectedToken) {
        return NextResponse.json(
            {error: 'Invalid signed token'},
            {status: 403}
        );
    }

    const expiresAt = parseInt(expires!, 10);
    if (Date.now() > expiresAt) {
        return NextResponse.json(
            {error: 'Signed token expired'},
            {status: 403}
        );
    }

    if (!result.file || !Buffer.isBuffer(result.file)) {
        return NextResponse.json(
            {error: "Invalid file payload"},
            {status: 500}
        );
    }

    const fileStream = Readable.from(result.file);

    const stream = new ReadableStream({
        start(controller) {
            fileStream.on('data', (chunk) => controller.enqueue(chunk));
            fileStream.on('end', () => controller.close());
            fileStream.on('error', (err) => controller.error(err));
        },
    });

    return new NextResponse(stream, {
        headers: {
            'Content-Disposition': `attachment; filename="${fileName}"`,
            'Content-Type': 'application/octet-stream',
        },
    });
}


