import {NextResponse} from "next/server";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {checkFileExistsInBucket, getObjectFromClient} from "@/utils/s3-file-management";
import {env} from "@/env.mjs";
import * as stream from "node:stream";
import path from "path";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {eq} from "drizzle-orm";
import {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/dispatch";
import {Readable} from "node:stream";

export async function GET(
    req: Request,
    {params}: { params: Promise<{ fileName: string }> }
) {


    const fileName = (await params).fileName;


    if (!fileName) return NextResponse.json({error: "Missing file parameter"}, {status: 400});

    const session = await auth.api.getSession({headers: await headers()});
    if (!session) return NextResponse.json({error: "Unauthorized"}, {status: 403});

    const settings = await db.query.setting.findFirst({
        where: eq(drizzleDb.schemas.setting.name, "system"),
        with: {
            storageChannel: true
        }
    });

    if (!settings || !settings.storageChannel) {
        return NextResponse.json({error: "Unable to get settings or no default storage channel"});
    }


    const ext = fileName.split(".").pop()?.toLowerCase();
    const contentType =
        ext === "png"
            ? "image/png"
            : ext === "jpg" || ext === "jpeg"
                ? "image/jpeg"
                : ext === "gif"
                    ? "image/gif"
                    : ext === "webp"
                        ? "image/webp"
                        : "application/octet-stream";

    try {

        const path = `images/${fileName}`;

        const input: StorageInput = {
            action: "get",
            data: {
                path: path,
            }
        }

        const result = await dispatchStorage(input, undefined, settings.storageChannel.id);

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
                'Content-Disposition': `inline; filename="${fileName}"`,
                "Cache-Control": "no-store",
                "Content-Type": contentType,
            },
        });

    } catch (err) {
        console.error("Error streaming image:", err);
        return NextResponse.json({error: "Error fetching file"}, {status: 500});
    }
}