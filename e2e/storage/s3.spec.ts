import {expect, test} from "@playwright/test";
import {getEnv} from "../helpers/env";
import {LOCAL_STORAGE_PATH} from "../helpers/session";
import {
    cancel, create, get, remove, submit, testConnection, testFromEdit,
} from "../helpers/storage";

test.use({storageState: LOCAL_STORAGE_PATH});

const providers = [
    {
        title: "AWS S3",
        requiredChannelName: "AWS S3 E2E Required",
        optionalChannelName: "AWS S3 E2E Optional",
        invalidChannelName: "AWS S3 E2E Invalid",
        endpointUrl: getEnv("E2E_STORAGE_AWS_S3_ENDPOINT_URL"),
        region: getEnv("E2E_STORAGE_AWS_S3_REGION"),
        accessKey: getEnv("E2E_STORAGE_AWS_S3_ACCESS_KEY"),
        secretKey: getEnv("E2E_STORAGE_AWS_S3_SECRET_KEY"),
        bucketName: getEnv("E2E_STORAGE_AWS_S3_BUCKET_NAME"),
        port: getEnv("E2E_STORAGE_AWS_S3_PORT"),
        invalidAccessKey: "wrong-aws-access-key",
        invalidSecretKey: "wrong-aws-secret-key",
    },
    {
        title: "Cloudflare R2",
        requiredChannelName: "Cloudflare R2 E2E Required",
        optionalChannelName: "Cloudflare R2 E2E Optional",
        invalidChannelName: "Cloudflare R2 E2E Invalid",
        endpointUrl: getEnv("E2E_STORAGE_R2_ENDPOINT_URL"),
        region: getEnv("E2E_STORAGE_R2_REGION"),
        accessKey: getEnv("E2E_STORAGE_R2_ACCESS_KEY"),
        secretKey: getEnv("E2E_STORAGE_R2_SECRET_KEY"),
        bucketName: getEnv("E2E_STORAGE_R2_BUCKET_NAME"),
        port: getEnv("E2E_STORAGE_R2_PORT"),
        invalidAccessKey: "wrong-r2-access-key",
        invalidSecretKey: "wrong-r2-secret-key",
    },
] as const;

for (const provider of providers) {
    test.describe(provider.title, () => {
        // test.describe.serial("Valid channels", () => {
        //     test(`Create and test a valid ${provider.title} channel`, async ({page}) => {
        //         await page.goto("/dashboard/storages/channels");
        //         await expect(page.getByRole("heading", {name: "Storage channels"})).toBeVisible();
        //         await create(page, "S3", provider.requiredChannelName, async (page) => {
        //             await page.getByLabel(/Endpoint URL/).fill(provider.endpointUrl);
        //             await page.getByLabel(/Access Key/).fill(provider.accessKey);
        //             await page.getByLabel(/Secret Key/).fill(provider.secretKey);
        //             await page.getByLabel(/Bucket name/).fill(provider.bucketName);
        //         });
        //         await expect(page.getByRole("heading", {name: "Add Storage Channel"})).toBeVisible();
        //         await testConnection(page);
        //         await expect(page.getByText("Successfully connected to storage channel")).toBeVisible();
        //         await submit(page);
        //         await expect(page.getByText("Storage channel has been successfully created.")).toBeVisible();
        //         await expect(get(page, provider.requiredChannelName)).toBeVisible();
        //
        //         await testFromEdit(page, provider.requiredChannelName);
        //         await expect(page.getByRole("heading", {name: "Edit Storage Channel"})).toBeVisible();
        //         await expect(page.getByText("Successfully connected to storage channel")).toBeVisible();
        //         await cancel(page);
        //     });
        //
        //     test(`Create and test a valid ${provider.title} channel with optional region and port`, async ({page}) => {
        //         await page.goto("/dashboard/storages/channels");
        //         await expect(page.getByRole("heading", {name: "Storage channels"})).toBeVisible();
        //         await create(page, "S3", provider.optionalChannelName, async (page) => {
        //             await page.getByLabel(/Endpoint URL/).fill(provider.endpointUrl);
        //             await page.getByLabel(/^Region$/).fill(provider.region);
        //             await page.getByLabel(/Access Key/).fill(provider.accessKey);
        //             await page.getByLabel(/Secret Key/).fill(provider.secretKey);
        //             await page.getByLabel(/Bucket name/).fill(provider.bucketName);
        //             await page.getByLabel(/^Port$/).fill(provider.port);
        //         });
        //         await expect(page.getByRole("heading", {name: "Add Storage Channel"})).toBeVisible();
        //         await testConnection(page);
        //         await expect(page.getByText("Successfully connected to storage channel")).toBeVisible();
        //         await submit(page);
        //         await expect(page.getByText("Storage channel has been successfully created.")).toBeVisible();
        //         await expect(get(page, provider.optionalChannelName)).toBeVisible();
        //
        //         await testFromEdit(page, provider.optionalChannelName);
        //         await expect(page.getByRole("heading", {name: "Edit Storage Channel"})).toBeVisible();
        //         await expect(page.getByText("Successfully connected to storage channel")).toBeVisible();
        //         await cancel(page);
        //     });
        // });

        test.describe.serial("Invalid channel", () => {
            test(`Create and test invalid ${provider.title} channel`, async ({page}) => {
                await page.goto("/dashboard/storages/channels");
                await expect(page.getByRole("heading", {name: "Storage channels"})).toBeVisible();
                await create(page, "S3", provider.invalidChannelName, async (page) => {
                    await page.getByLabel(/Endpoint URL/).fill(provider.endpointUrl);
                    await page.getByLabel(/^Region$/).fill(provider.region);
                    await page.getByLabel(/Access Key/).fill(provider.invalidAccessKey);
                    await page.getByLabel(/Secret Key/).fill(provider.invalidSecretKey);
                    await page.getByLabel(/Bucket name/).fill(provider.bucketName);
                    await page.getByLabel(/^Port$/).fill(provider.port);
                });
                await expect(page.getByRole("heading", {name: "Add Storage Channel"})).toBeVisible();
                await testConnection(page);
                await expect(page.getByText("An error occurred while testing the storage channel")).toBeVisible();
                await submit(page);
                await expect(page.getByText("Storage channel has been successfully created.")).toBeVisible();
                await expect(get(page, provider.invalidChannelName)).toBeVisible();
            });

            test(`Delete invalid ${provider.title} channel`, async ({page}) => {
                await page.goto("/dashboard/storages/channels");
                await expect(page.getByRole("heading", {name: "Storage channels"})).toBeVisible();
                await expect(get(page, provider.invalidChannelName)).toBeVisible();
                await remove(page, provider.invalidChannelName);
                await expect(page.getByText("Storage channel has been successfully removed.")).toBeVisible();
                await expect(page.getByText(provider.invalidChannelName)).toHaveCount(0);
            });
        });
    });
}
