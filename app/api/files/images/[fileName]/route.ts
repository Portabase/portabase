import {NextResponse} from "next/server";
import {auth} from "@/lib/auth/auth";
import {headers} from "next/headers";
import {StorageInput} from "@/features/storages/types";
import {dispatchStorage} from "@/features/storages/dispatch";
import {Readable} from "node:stream";
import {logger} from "@/lib/logger";

const log = logger.child({module: "api/files/images"});

export async function GET(
    req: Request,
    {params}: { params: Promise<{ fileName: string }> }
) {
    const {searchParams} = new URL(req.url);
    const fileName = (await params).fileName;
    const storageId = searchParams.get('storageId');

    if (!fileName) return NextResponse.json({error: "Missing file parameter"}, {status: 400});

    const session = await auth.api.getSession({headers: await headers()});
    if (!session) return NextResponse.json({error: "Unauthorized"}, {status: 403});


    if (!storageId) {
        return NextResponse.json({error: "Missing storageId in search params"}, {status: 404})
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
            },
            metadata: {
                storageId: storageId,
                fileKind: "images"
            }
        }

        const result = await dispatchStorage(input, undefined, storageId);

        if (!result.file || !(result.file instanceof Readable)) {
            log.error({error: result}, `An error occurred while getting file`);
            return NextResponse.json(
                {error: "Invalid file payload"},
                {status: 500}
            );
        }

        const fileStream = Readable.from(result.file as Readable);

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
        log.error({error: err}, `Error streaming image`);
        return NextResponse.json({error: "Error fetching file"}, {status: 500});
    }
}