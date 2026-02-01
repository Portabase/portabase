import express, {Request, Response, Router} from "express";
import {v4 as uuidv4} from "uuid";
import {and, eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {db} from "@/db";
import {isUuidv4} from "@/utils/verify-uuid";
import uploadTempFileToProviders, {createDecryptionStream} from "@/features/api/upload/helpers/common";
import {sendNotificationsBackupRestore} from "@/features/notifications/helpers";
import {Backup} from "@/db/schema/07_database";
import {withUpdatedAt} from "@/db/utils";
import {eventEmitter} from "@/features/shared/event";
import {getFileExtension, saveStreamToTempFile} from "@/features/api/upload/helpers/file";

const router: Router = express.Router();

// router.post("/:agentId", async (req: Request, res: Response) => {
//     try {
//         const agentId = req.params.agentId as string | undefined;
//         const generatedId = req.headers["x-generated-id"] as string | undefined;
//         const status = req.headers["x-status"] as string | undefined;
//         const encryptedAesKeyHex = req.headers["x-aes-key"] as string | undefined;
//         const ivHex = req.headers["x-iv"] as string | undefined;
//         const method = (req.headers["x-method"] as string) ?? "manual";
//         const extension = req.headers["x-extension"] as string | undefined;
//
//
//         if (!generatedId || !encryptedAesKeyHex || !ivHex || !agentId || !status) {
//             return res.status(400).json({error: "Missing required headers/params"});
//         }
//
//         if (!isUuidv4(generatedId)) {
//             return res.status(400).json({error: "generatedId is not a valid UUID"});
//         }
//
//         const agent = await db.query.agent.findFirst({
//             where: eq(drizzleDb.schemas.agent.id, agentId),
//         });
//
//         if (!agent) {
//             return res.status(404).json({error: "Agent not found"});
//         }
//
//
//         const database = await db.query.database.findFirst({
//             where: eq(drizzleDb.schemas.database.agentDatabaseId, generatedId),
//             with: {
//                 project: true,
//                 storagePolicies: true,
//             },
//         });
//
//         if (!database) {
//             return res.status(404).json({error: "Database not found"});
//         }
//
//         let backup: Backup | null | undefined = null;
//
//         if (method === "automatic") {
//             [backup] = await db
//                 .insert(drizzleDb.schemas.backup)
//                 .values({
//                     status: "ongoing",
//                     databaseId: database.id,
//                 })
//                 .returning();
//         } else {
//             backup = await db.query.backup.findFirst({
//                 where: and(
//                     eq(drizzleDb.schemas.backup.databaseId, database.id),
//                     eq(drizzleDb.schemas.backup.status, "ongoing")
//                 ),
//             });
//         }
//
//         if (!backup) {
//             return res.status(404).json({error: "Backup not found"});
//         }
//
//
//         if (status === "success") {
//
//             const decipher = createDecryptionStream(encryptedAesKeyHex, ivHex);
//
//             const fileExt = extension || getFileExtension(database.dbms);
//             const fileName = `${uuidv4()}${fileExt}`;
//
//             const decryptedStream = req.pipe(decipher);
//
//             const tmpPath = await saveStreamToTempFile(decryptedStream, fileName);
//
//
//
//
//             if (!tmpPath) {
//                 return res.status(500).json({
//                     error: "Unable to save tmp backup file",
//                 });
//             }
//
//             uploadTempFileToProviders(backup, database, tmpPath, fileName);
//
//             return res.json({success: true});
//         } else {
//             await db
//                 .update(drizzleDb.schemas.backup)
//                 .set(withUpdatedAt({status: 'failed'}))
//                 .where(eq(drizzleDb.schemas.backup.id, backup.id));
//
//             eventEmitter.emit('modification', {update: true});
//
//             await sendNotificationsBackupRestore(database, "error_backup");
//
//             return res.status(200).json({
//                 error: "Backup successfully updated with status failed",
//             });
//         }
//     } catch (err: any) {
//         console.error("Upload error:", err);
//         return res.status(500).json({
//             error: "Upload failed",
//             detail: err.message,
//         });
//     }
// });
router.post("/:agentId", async (req: Request, res: Response) => {
    const agentId = req.params.agentId as string | undefined;
    const generatedId = req.headers["x-generated-id"] as string | undefined;
    const status = req.headers["x-status"] as string | undefined;
    const encryptedAesKeyHex = req.headers["x-aes-key"] as string | undefined;
    const ivHex = req.headers["x-iv"] as string | undefined;
    const method = (req.headers["x-method"] as string) ?? "manual";
    const extension = req.headers["x-extension"] as string | undefined;

    if (!generatedId || !encryptedAesKeyHex || !ivHex || !agentId || !status) {
        return res.status(400).json({error: "Missing required headers/params"});
    }
    if (!isUuidv4(generatedId)) {
        return res.status(400).json({error: "generatedId is not a valid UUID"});
    }

    const agent = await db.query.agent.findFirst({ where: eq(drizzleDb.schemas.agent.id, agentId) });
    if (!agent) return res.status(404).json({error: "Agent not found"});

    const database = await db.query.database.findFirst({
        where: eq(drizzleDb.schemas.database.agentDatabaseId, generatedId),
        with: { project: true, storagePolicies: true },
    });
    if (!database) return res.status(404).json({error: "Database not found"});

    let backup: Backup | null = null;
    if (method === "automatic") {
        [backup] = await db.insert(drizzleDb.schemas.backup).values({ status: "ongoing", databaseId: database.id }).returning();
    } else {
        backup = await db.query.backup.findFirst({
            where: and(
                eq(drizzleDb.schemas.backup.databaseId, database.id),
                eq(drizzleDb.schemas.backup.status, "ongoing")
            ),
        });
    }
    if (!backup) return res.status(404).json({error: "Backup not found"});

    res.status(202).json({success: true, message: "Backup received, processing in background"});

    (async () => {
        try {
            if (status === "success") {
                const decipher = createDecryptionStream(encryptedAesKeyHex!, ivHex!);
                const fileExt = extension || getFileExtension(database.dbms);
                const fileName = `${uuidv4()}${fileExt}`;
                const decryptedStream = req.pipe(decipher);
                const tmpPath = await saveStreamToTempFile(decryptedStream, fileName);

                if (!tmpPath) throw new Error("Unable to save tmp backup file");

                await uploadTempFileToProviders(backup!, database, tmpPath, fileName);
            } else {
                await db.update(drizzleDb.schemas.backup)
                    .set(withUpdatedAt({status: 'failed'}))
                    .where(eq(drizzleDb.schemas.backup.id, backup!.id));

                eventEmitter.emit('modification', {update: true});
                await sendNotificationsBackupRestore(database, "error_backup");
            }
        } catch (err) {
            console.error("Background backup processing failed:", err);
            try {
                await db.update(drizzleDb.schemas.backup)
                    .set(withUpdatedAt({status: 'failed'}))
                    .where(eq(drizzleDb.schemas.backup.id, backup!.id));
            } catch (_) {
            }
        }
    })();
});



export default router;


