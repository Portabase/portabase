import fs from "fs";
import path from "path";
import {promisify} from "util";
import {pipeline} from "stream";

const pipelineAsync = promisify(pipeline);
const TMP_DIR = path.join(process.cwd(), "private/uploads/tmp");
fs.mkdirSync(TMP_DIR, { recursive: true });

export async function saveStreamToTempFile(stream: NodeJS.ReadableStream, fileName: string): Promise<string> {
    const tmpPath = path.join(TMP_DIR, fileName);
    const writeStream = fs.createWriteStream(tmpPath);
    await pipelineAsync(stream, writeStream);
    return tmpPath;
}
