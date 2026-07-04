import {NextResponse} from "next/server";
import fs from "fs";
import path from "path";
import {and, eq} from "drizzle-orm";
import {db} from "@/db";
import * as drizzleDb from "@/db";
import {env} from "@/env.mjs";
import {logger} from "@/lib/logger";

const log = logger.child({module: "api/tus/hooks"});

const FILE_PATH_RE = /^backups\/\d{4}-\d{2}-\d{2}\/[A-Za-z0-9._-]+$/;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const event = body.Event
        const headers = event.HTTPRequest.Header
        const uploadLength = headers["X-File-Size"]?.[0];
        const uploadOffset = headers["Upload-Offset"]?.[0];
        const status = headers["X-Status"]?.[0];

        log.info(`Upload ID : ${event.Upload.ID} (${uploadOffset}/${uploadLength})`);

        if (status === "success") {
            if (
                body.Type === "post-receive" &&
                event.Upload.SizeIsDeferred === false &&
                event.Upload.Offset === event.Upload.Size
            ) {
                const id = event.Upload.ID;
                const filePath = headers["X-File-Path"]?.[0];

                if (!filePath || !FILE_PATH_RE.test(filePath)) {
                    log.warn({filePath}, "Rejected invalid X-File-Path in TUS hook");
                    return NextResponse.json({error: "Invalid file path"}, {status: 400});
                }

                const generatedId = headers["X-Generated-Id"]?.[0];
                const backupStorageId = headers["X-Backup-Storage-Id"]?.[0];


                console.log(`Backup Storage ID : ${backupStorageId}`);
                console.log(`generatedId : ${generatedId}`);

                if (backupStorageId) {
                    if (!generatedId) {
                        log.warn("Missing X-Generated-Id in TUS hook");
                        return NextResponse.json({error: "Forbidden"}, {status: 403});
                    }

                    const database = await db.query.database.findFirst({
                        where: eq(drizzleDb.schemas.database.agentDatabaseId, generatedId),
                    });

                    if (!database) {
                        log.warn({generatedId}, "No database for X-Generated-Id in TUS hook");
                        return NextResponse.json({error: "Forbidden"}, {status: 403});
                    }

                    const storage = await db.query.backupStorage.findFirst({
                        where: and(
                            eq(drizzleDb.schemas.backupStorage.id, backupStorageId),
                        ),
                        with: {backup: true},
                    });

                    if (!storage || storage.backup?.databaseId !== database.id) {
                        log.warn({backupStorageId, generatedId}, "No pending backup storage matches TUS hook");
                        return NextResponse.json({error: "Forbidden"}, {status: 403});
                    }
                } else {
                    log.warn("TUS hook without X-Backup-Storage-Id (legacy agent)");
                }

                const uploadDir = path.join(env.PRIVATE_PATH!, "/uploads/");

                const oldFilePath = path.join(uploadDir, "tmp", id);

                const resolvedBase = path.resolve(uploadDir);
                const newFilePath = path.resolve(resolvedBase, filePath);
                const rel = path.relative(resolvedBase, newFilePath);
                if (rel.startsWith("..") || path.isAbsolute(rel)) {
                    log.warn({filePath}, "Rejected path traversal in TUS hook");
                    return NextResponse.json({error: "Invalid file path"}, {status: 400});
                }

                fs.mkdirSync(path.dirname(newFilePath), {recursive: true});

                let retries = 10;
                while (!fs.existsSync(oldFilePath)) {
                    if (retries-- === 0) {
                        return NextResponse.json({error: `Upload file not found: ${oldFilePath}`}, {status: 500});
                    }
                    await new Promise(r => setTimeout(r, 200));
                }

                fs.renameSync(oldFilePath, newFilePath);

                const infoFilePath = `${oldFilePath}.info`;
                if (fs.existsSync(infoFilePath)) {
                    fs.unlinkSync(infoFilePath);
                }

                const metadataHeaderB64 = headers["Upload-Metadata"]?.[0];

                if (metadataHeaderB64) {
                    const metadataHeader = Buffer.from(metadataHeaderB64, "base64").toString("utf-8");
                    if (metadataHeader) {
                        const tomlContent = metadataHeader
                            .split(",")
                            .map((pair) => {
                                const [key, value] = pair.split(" ");
                                const escapedValue = value.replace(/"/g, '\\"');
                                return `${key} = "${escapedValue}"`;
                            })
                            .join("\n");
                        const metaFilePath = `${newFilePath}.meta`;
                        fs.writeFileSync(metaFilePath, tomlContent, "utf-8");
                    }
                }
            }
        }
        return NextResponse.json({});
    } catch (error) {
        log.error({error: error}, "TUS Hook error");
        return NextResponse.json({error: "Internal server error"}, {status: 500});
    }
}
