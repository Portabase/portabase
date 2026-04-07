import {expect, test} from "@playwright/test";
import {
    cancel, create, get, remove, submit, testFromEdit,
} from "../helpers/notification";
import {getEnv} from "../helpers/env";
import {LOCAL_STORAGE_PATH} from "../helpers/session";

test.use({storageState: LOCAL_STORAGE_PATH});

const requiredChannelName = "Webhook E2E Required";
const optionalChannelName = "Webhook E2E Optional";
const invalidChannelName = "Webhook E2E Invalid";

// test.describe.serial("Valid channels", () => {
//     test("Create and test a valid Webhook channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "Webhook", requiredChannelName, async (page) => {
//             await page.getByLabel(/Webhook URL/).fill(getEnv("E2E_NOTIFICATION_WEBHOOK_URL"));
//         });
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, requiredChannelName)).toBeVisible();
//         await testFromEdit(page, requiredChannelName);
//         await expect(page.getByText("Sent to Webhook")).toBeVisible();
//         await cancel(page);
//     });
//
//     test("Create and test a valid Webhook channel with optional header", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "Webhook", optionalChannelName, async (page) => {
//             await page.getByLabel(/Webhook URL/).fill(getEnv("E2E_NOTIFICATION_WEBHOOK_URL"));
//             await page.getByLabel(/^Header Name$/).fill(getEnv("E2E_NOTIFICATION_WEBHOOK_SECRET_HEADER"));
//             await page.getByLabel(/^Secret Value$/).fill(getEnv("E2E_NOTIFICATION_WEBHOOK_SECRET"));
//         });
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, optionalChannelName)).toBeVisible();
//         await testFromEdit(page, optionalChannelName);
//         await expect(page.getByText("Sent to Webhook")).toBeVisible();
//         await cancel(page);
//     });
// });

test.describe.serial("Invalid channel", () => {
    test("Create and test invalid Webhook channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await create(page, "Webhook", invalidChannelName, async (page) => {
            await page.getByLabel(/Webhook URL/).fill("https://webhook.example.com/api/wrong-webhook");
            await page.getByLabel(/^Header Name$/).fill(getEnv("E2E_NOTIFICATION_WEBHOOK_SECRET_HEADER"));
            await page.getByLabel(/^Secret Value$/).fill("wrong-webhook-secret");
        });
        await submit(page);
        await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await testFromEdit(page, invalidChannelName);
        await expect(page.getByText("An error occurred while testing the notification channel, check your configuration")).toBeVisible();
        await cancel(page);
    });

    test("Delete invalid Webhook E2E channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await remove(page, invalidChannelName);
        await expect(page.getByText("Notification channel has been successfully removed.")).toBeVisible();
        await expect(page.getByText(invalidChannelName)).toHaveCount(0);
    });
});
