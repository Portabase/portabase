import {expect, test} from "@playwright/test";
import {getEnv} from "../helpers/env";
import {LOCAL_STORAGE_PATH} from "../helpers/session";
import {
    cancel, create, get, remove, submit, testConnection, testFromEdit,
} from "../helpers/storage";

test.use({storageState: LOCAL_STORAGE_PATH});

const requiredChannelName = "Google Drive E2E Required";
const invalidChannelName = "Google Drive E2E Invalid";

// test.describe.serial("Valid channel", () => {
//     test("Create and test a valid Google Drive channel", async ({page}) => {
//         await page.goto("/dashboard/storages/channels");
//         await expect(page.getByRole("heading", {name: "Storage channels"})).toBeVisible();
//         await create(page, "Google Drive", requiredChannelName, async (page) => {
//             await page.getByLabel(/Client ID/).fill(getEnv("E2E_STORAGE_GOOGLE_DRIVE_CLIENT_ID"));
//             await page.getByLabel(/Client Secret/).fill(getEnv("E2E_STORAGE_GOOGLE_DRIVE_CLIENT_SECRET"));
//             await page.getByLabel(/Folder ID/).fill(getEnv("E2E_STORAGE_GOOGLE_DRIVE_FOLDER_ID"));
//         });
//         await expect(page.getByRole("heading", {name: "Add Storage Channel"})).toBeVisible();
//         await testConnection(page);
//         await expect(page.getByText("Successfully connected to storage channel")).toBeVisible();
//         await submit(page);
//         await expect(page.getByText("Storage channel has been successfully created.")).toBeVisible();
//         await expect(get(page, requiredChannelName)).toBeVisible();
//
//         await testFromEdit(page, requiredChannelName);
//         await expect(page.getByRole("heading", {name: "Edit Storage Channel"})).toBeVisible();
//         await expect(page.getByText("Successfully connected to storage channel")).toBeVisible();
//         await cancel(page);
//     });
// });

test.describe.serial("Invalid channel", () => {
    test("Create and test invalid Google Drive channel", async ({page}) => {
        await page.goto("/dashboard/storages/channels");
        await expect(page.getByRole("heading", {name: "Storage channels"})).toBeVisible();
        await create(page, "Google Drive", invalidChannelName, async (page) => {
            await page.getByLabel(/Client ID/).fill(getEnv("E2E_STORAGE_GOOGLE_DRIVE_CLIENT_ID"));
            await page.getByLabel(/Client Secret/).fill("wrong-google-drive-client-secret");
            await page.getByLabel(/Folder ID/).fill(getEnv("E2E_STORAGE_GOOGLE_DRIVE_FOLDER_ID"));
        });
        await testConnection(page);
        await expect(page.getByText("An error occurred while testing the storage channel")).toBeVisible();
        await submit(page);
        await expect(page.getByText("Storage channel has been successfully created.")).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
    });

    test("Delete invalid Google Drive E2E channel", async ({page}) => {
        await page.goto("/dashboard/storages/channels");
        await expect(page.getByRole("heading", {name: "Storage channels"})).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await remove(page, invalidChannelName);
        await expect(page.getByText("Storage channel has been successfully removed.")).toBeVisible();
        await expect(page.getByText(invalidChannelName)).toHaveCount(0);
    });
});
