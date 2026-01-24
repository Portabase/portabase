"use server";
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {v4 as uuidv4} from "uuid";
import {db} from "@/db";
import {eq} from "drizzle-orm";
import * as drizzleDb from "@/db";
import {ServerActionResult} from "@/types/action-type";
import {dispatchStorage} from "@/features/storages/dispatch";
import {StorageInput} from "@/features/storages/types";
import sharp from "sharp";


export const uploadUserImageAction = userAction.schema(
    z.instanceof(FormData)
).action(async ({parsedInput: formData}): Promise<ServerActionResult<string>> => {
    try {

        const file = formData.get("file") as File;
        const uuid = uuidv4();
        const fileFormat = file.name.split(".").pop();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);


        const isPng = fileFormat === "png";
        const isWebp = fileFormat === "webp";

        const compressedBuffer = await sharp(buffer)
            .resize({ width: 1024 })
            .toFormat(isPng ? "png" : isWebp ? "webp" : "jpeg", {
                quality: 80,
                compressionLevel: isPng ? 9 : undefined
            })
            .toBuffer();



        const settings = await db.query.setting.findFirst({
            where: eq(drizzleDb.schemas.setting.name, "system"),
            with: {
                storageChannel: true
            }
        });

        if (!settings || !settings.storageChannel) {
            return {
                success: false,
                actionError: {
                    message: "An error occurred with default settings.",
                    status: 500,
                },
            };
        }

        const path = `images/${uuid}.${fileFormat?.toLowerCase()}`;

        const input: StorageInput = {
            action: "upload",
            data: {
                path: path,
                file: compressedBuffer,
                url: true
            },
            metadata: {
                storageId: settings.storageChannel.id,
                fileKind: "images"
            }
        }

        const result = await dispatchStorage(input, undefined, settings.storageChannel.id);
        console.log(result);
        if (!result.success) {
            return {
                success: false,
                actionError: {
                    message: "Failed to upload user avatar.",
                    status: 500,
                    cause: result.error
                },
            };
        }

        return {
            success: true,
            value: result.url,
            actionSuccess: {
                message: "Avatar successfully updated",
            },
        };
    } catch (error) {
        return {
            success: false,
            actionError: {
                message: "Failed to upload user avatar.",
                status: 500,
                cause: error instanceof Error ? error.message : "Unknown error",
            },
        };
    }
});



