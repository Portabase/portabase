import {NextResponse} from "next/server";
import {isUuidv4} from "@/utils/verify-uuid";
import {uploadLocalPrivate, uploadS3Private} from "@/features/upload/private/upload.action";
import {v4 as uuidv4} from "uuid";
import {eventEmitter} from "../../../events/route";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {Backup} from "@/db/schema/07_database";
import {and, eq} from "drizzle-orm";
import {env} from "@/env.mjs";
import {withUpdatedAt} from "@/db/utils";
import {decryptedDump, getFileExtension} from "./helpers";
import {sendNotificationsBackupRestore} from "@/features/notifications/helpers";

export async function POST(
    request: Request,
    {params}: { params: Promise<{ agentId: string }> }
) {
    try {
        const contentType = request.headers.get("Content-Type");

        if (!contentType || !contentType.includes("multipart/form-data")) {
            return NextResponse.json(
                {error: "Unsupported or missing Content-Type"},
                {status: 400}
            );
        }
        eventEmitter.emit('modification', {update: true});

        const agentId = (await params).agentId;
        const formData = await request.formData();
        const aesKeyHex = formData.get("aes_key") as string;
        const ivHex = formData.get("iv") as string;
        const generatedId = formData.get("generatedId") as string | null;
        const method = formData.get("method") as string | null;

        if (!generatedId || !isUuidv4(generatedId)) {
            return NextResponse.json(
                {error: "generatedId is not a valid UUID"},
                {status: 400}
            );
        }

        const agent = await db.query.agent.findFirst({
            where: eq(drizzleDb.schemas.agent.id, agentId),
        });

        if (!agent) {
            return NextResponse.json(
                {error: "Agent not found"},
                {status: 404}
            );
        }

        const database = await db.query.database.findFirst({
            where: eq(drizzleDb.schemas.database.agentDatabaseId, generatedId),
            with: {
                project: true,
                alertPolicies: true
            }
        });

        if (!database) {
            return NextResponse.json(
                {error: "Database associated with generatedId not found"},
                {status: 404}
            );
        }

        let backup: Backup | null | undefined = null;

        if (method === "automatic") {
            [backup] = await db
                .insert(drizzleDb.schemas.backup)
                .values({
                    status: 'ongoing',
                    databaseId: database.id,
                })
                .returning();


            if (!backup) {
                return NextResponse.json(
                    {error: "Unable to create an automatic backup"},
                    {status: 500}
                );
            }
        } else {
            backup = await db.query.backup.findFirst({
                where: and(
                    eq(drizzleDb.schemas.backup.status, 'ongoing'),
                    eq(drizzleDb.schemas.backup.databaseId, database.id),
                ),
            });


            if (!backup) {
                return NextResponse.json(
                    {error: "Unable to find the corresponding backup"},
                    {status: 404}
                );
            }
        }

        const status = formData.get("status") as string | null;

        if (status === "success") {
            const file = formData.get("file") as File | null;
            const extension = formData.get("extension") as string | null;
            if (!aesKeyHex || !ivHex) {
                return NextResponse.json({error: "Missing fields"}, {status: 400});
            }


            if (!file) {
                return NextResponse.json(
                    {error: "File is required for successful backup"},
                    {status: 400}
                );
            }
            const fileSizeBytes = file.size;
            // const fileExtension = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
            const fileExtension = extension ? extension : getFileExtension(database.dbms)
            const decryptedFile = await decryptedDump(file, aesKeyHex, ivHex, fileExtension);
            const uuid = uuidv4();
            const fileName = `${uuid}${fileExtension}`;
            const buffer = Buffer.from(await decryptedFile.arrayBuffer());
            const [settings] = await db.select().from(drizzleDb.schemas.setting).where(eq(drizzleDb.schemas.setting.name, "system")).limit(1);
            if (!settings) {
                throw new Error("System settings not found.");
            }

            let success: boolean, message: string, filePath: string;

            const result =
                settings.storage === "local"
                    ? await uploadLocalPrivate(fileName, buffer)
                    : await uploadS3Private(`${database.project?.slug}/${fileName}`, buffer, env.S3_BUCKET_NAME!);

            ({success, message, filePath} = result);

            if (!success) {
                return NextResponse.json(
                    {error: message},
                    {status: 500}
                );
            }

            await db
                .update(drizzleDb.schemas.backup)
                .set(withUpdatedAt({
                    file: fileName,
                    fileSize: fileSizeBytes,
                    status: 'success',
                }))
                .where(eq(drizzleDb.schemas.backup.id, backup.id));

            eventEmitter.emit('modification', {update: true});

            await sendNotificationsBackupRestore(database, "success_backup");

            return NextResponse.json(
                {
                    message: "Backup successfully uploaded",
                },
                {status: 200}
            );
        } else {

            await db
                .update(drizzleDb.schemas.backup)
                .set(withUpdatedAt({status: 'failed'}))
                .where(eq(drizzleDb.schemas.backup.id, backup.id));

            eventEmitter.emit('modification', {update: true});

            await sendNotificationsBackupRestore(database, "error_backup");


            return NextResponse.json(
                {
                    message: "Backup successfully updated with status failed",
                },
                {status: 200}
            );
        }
    } catch (error) {
        console.error("Error in POST handler:", error);
        return NextResponse.json(
            {error: "Internal server error"},
            {status: 500}
        );
    }
}

