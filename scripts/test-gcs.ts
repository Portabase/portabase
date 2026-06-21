// Steps to test
// 1. Run from the repo root:
    // mkdir -p gcs-data/test-bucket
    // echo "hello" > gcs-data/test-bucket/seed.txt
// 2. Start fake server and confirm it's runnning 
    // docker compose -f docker-compose.gcs.yml up -d
    // curl http://localhost:4443/storage/v1/b
    // [Expected output] test-bucket in the JSON 
// 3. Run this script:
    // GCS_EMULATOR_HOST=http://localhost:4443 npx tsx scripts/test-gcs.ts
    // [Expected output] each operation prints success: true, and the get step prints content: hello world
// 4. Tear down when done
    // docker compose -f docker-compose.gcs.yml down


import { Readable } from "node:stream";
import {
  uploadGoogleCloudStorage,
  getGoogleCloudStorage,
  copyGoogleCloudStorage,
  deleteGoogleCloudStorage,
  pingGoogleCloudStorage,
} from "@/features/channel/storages/google-cloud-storage";
import type { GoogleCloudStorageConfig } from "@/features/channel/storages/google-cloud-storage/types";

const config: GoogleCloudStorageConfig = {
  projectId: "test-project",
  bucketName: "test-bucket",            // must match the folder from Step 2
  clientEmail: "fake@test.iam.gserviceaccount.com",
  privateKey: "unused-when-emulated",
};

async function streamToString(s: Readable) {
  const chunks: Buffer[] = [];
  for await (const c of s) chunks.push(Buffer.from(c));
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  console.log("ping:", await pingGoogleCloudStorage(config));

  console.log("upload:", await uploadGoogleCloudStorage(config, {
    data: { path: "hello.txt", file: Buffer.from("hello world"), contentType: "text/plain" },
  }));

  const got = await getGoogleCloudStorage(config, {
    data: { path: "hello.txt" } as any,
    metadata: {} as any,
  });
  console.log("get success:", got.success);
  if (got.file) console.log("content:", await streamToString(got.file as Readable));

  console.log("copy:", await copyGoogleCloudStorage(config, {
    data: { from: "hello.txt", to: "hello-copy.txt" },
  }));

  console.log("delete:", await deleteGoogleCloudStorage(config, {
    data: { path: "hello.txt" },
  }));
}

main().catch(console.error);
