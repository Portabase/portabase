"use server";
import {userAction} from "@/lib/safe-actions/actions";
import {z} from "zod";
import {v4 as uuidv4} from "uuid";
import {mkdir, writeFile} from "fs/promises";
import path from "path";
import {env} from "@/env.mjs";
import {checkMinioAlive, saveFileInBucket} from "@/utils/s3-file-management";
//@ts-ignore
import {UploadedObjectInfo} from "minio/src/internal/type";
import {getServerUrl} from "@/utils/get-server-url";
import {db} from "@/db";
import {eq} from "drizzle-orm";
import {Setting} from "@/db/schema/01_setting";
import * as drizzleDb from "@/db";


const imageDir = "images/";


export const uploadImageAction = userAction
    .schema(z.instanceof(FormData))
    .action(async ({parsedInput: formData, ctx}) => {
        const file = formData.get("file") as File;
        const uuid = uuidv4();
        const fileFormat = file.name.split(".").pop();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const [settings] = await db
            .select()
            .from(drizzleDb.schemas.setting)
            .where(eq(drizzleDb.schemas.setting.name, "system"))
            .limit(1);

        if (!settings) throw new Error("System settings not found.");

        let fileName: string | null = null;
        let result: void | UploadedObjectInfo;

        if (settings.storage === "local") {
            fileName = `${imageDir}${uuid}.${fileFormat}`;
            result = await uploadLocal(fileName, buffer);
        } else if (settings.storage === "s3") {
            fileName = `${imageDir}${uuid}.${fileFormat}`;
            result = await uploadS3Compatible(env.S3_BUCKET_NAME ?? "", fileName, buffer);
        } else {
            throw new Error(`Unsupported storage type: ${settings.storage}`);
        }

        const url = `${getServerUrl()}/api/${fileName}`
        return {data: {result, url}};
    });


async function uploadLocal(fileName: string, buffer: any) {
    const localDir = "private/uploads/";
    try {
        await mkdir(path.join(process.cwd(), localDir), {recursive: true});
        return await writeFile(path.join(process.cwd(), localDir + fileName), buffer);
    } catch (error) {
        throw new Error("An error occured while importing image");
    }
}

async function uploadS3Compatible(bucketName: string, fileName: string, buffer: any) {
    return await saveFileInBucket({
        bucketName,
        fileName,
        file: buffer,
    });
}

function getUrl(fileName: string, settings: Setting, bucketName: string): string {
    if (settings.storage === "s3") {
        return `https://${env.S3_ENDPOINT}/${bucketName}/${fileName}`;
    } else if (settings.storage === "local") {
        const url = getServerUrl();
        return `${url}/api/images/${fileName}`;
    }
    throw new Error("Invalid storage configuration");
}

export async function checkConnexionToS3() {
    return await checkMinioAlive();
}
