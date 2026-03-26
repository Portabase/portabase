import {expect, test} from "@playwright/test";
import {
    cancel, create, get, remove, submit, testFromEdit,
} from "../helpers/notification";
import {getEnv} from "../helpers/env";
import {LOCAL_STORAGE_PATH} from "../helpers/session";

test.use({storageState: LOCAL_STORAGE_PATH});

const validChannelName = "Gotify E2E Required";
const invalidChannelName = "Gotify E2E Invalid";

// test.describe.serial("Valid channel", () => {
//     test("Create and test a valid Gotify channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "Gotify", validChannelName, async (page) => {
//             await page.getByLabel(/Gotify Server URL/).fill(getEnv("E2E_NOTIFICATION_GOTIFY_SERVER_URL"));
//             await page.getByLabel(/Application Token/).fill(getEnv("E2E_NOTIFICATION_GOTIFY_APP_TOKEN"));
//         });
//         await expect(page.getByRole("heading", {name: "Add Notification Channel"})).toBeVisible();
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, validChannelName)).toBeVisible();
//
//         await testFromEdit(page, validChannelName);
//         await expect(page.getByText("Sent to Gotify")).toBeVisible();
//         await cancel(page);
//     });
//
//     test("Edit and test a valid Gotify channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await expect(get(page, validChannelName)).toBeVisible();
//         await testFromEdit(page, validChannelName);
//         await expect(page.getByText("Sent to Gotify")).toBeVisible();
//         await cancel(page);
//     });
// });

test.describe.serial("Invalid channel", () => {
    test("Create and test invalid Gotify channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await create(page, "Gotify", invalidChannelName, async (page) => {
            await page.getByLabel(/Gotify Server URL/).fill(getEnv("E2E_NOTIFICATION_GOTIFY_SERVER_URL"));
            await page.getByLabel(/Application Token/).fill("wrong-gotify-app-token");
        });
        await expect(page.getByRole("heading", {name: "Add Notification Channel"})).toBeVisible();
        await submit(page);
        await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await testFromEdit(page, invalidChannelName);
        await expect(page.getByText("An error occurred while testing the notification channel, check your configuration")).toBeVisible();
        await cancel(page);
    });

    test("Delete invalid Gotify channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await remove(page, invalidChannelName);
        await expect(page.getByText("Notification channel has been successfully removed.")).toBeVisible();
        await expect(page.getByText(invalidChannelName)).toHaveCount(0);
    });
});
