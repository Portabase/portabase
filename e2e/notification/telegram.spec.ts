import {expect, test} from "@playwright/test";
import {
    cancel, create, get, remove, submit, testFromEdit,
} from "../helpers/notification";
import {getEnv} from "../helpers/env";
import {LOCAL_STORAGE_PATH} from "../helpers/session";

test.use({storageState: LOCAL_STORAGE_PATH});

const requiredChannelName = "Telegram E2E Required";
const optionalChannelName = "Telegram E2E Optional";
const invalidChannelName = "Telegram E2E Invalid";

// test.describe.serial("Valid channels", () => {
//     test("Create and test a valid Telegram channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "Telegram", requiredChannelName, async (page) => {
//             await page.getByLabel(/Telegram Bot Token/).fill(getEnv("E2E_NOTIFICATION_TELEGRAM_BOT_TOKEN"));
//             await page.getByLabel(/Telegram Chat ID/).fill(getEnv("E2E_NOTIFICATION_TELEGRAM_CHAT_ID"));
//         });
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, requiredChannelName)).toBeVisible();
//         await testFromEdit(page, requiredChannelName);
//         await expect(page.getByText("Sent to Telegram")).toBeVisible();
//         await cancel(page);
//     });
//
//     test("Create and test a valid Telegram channel with Topic ID", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "Telegram", optionalChannelName, async (page) => {
//             await page.getByLabel(/Telegram Bot Token/).fill(getEnv("E2E_NOTIFICATION_TELEGRAM_BOT_TOKEN"));
//             await page.getByLabel(/Telegram Chat ID/).fill(getEnv("E2E_NOTIFICATION_TELEGRAM_CHAT_ID"));
//             await page.getByLabel(/Telegram Topic ID/).fill(getEnv("E2E_NOTIFICATION_TELEGRAM_TOPIC_ID"));
//         });
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, optionalChannelName)).toBeVisible();
//         await testFromEdit(page, optionalChannelName);
//         await expect(page.getByText("Sent to Telegram")).toBeVisible();
//         await cancel(page);
//     });
// });

test.describe.serial("Invalid channel", () => {
    test("Create and test invalid Telegram channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await create(page, "Telegram", invalidChannelName, async (page) => {
            await page.getByLabel(/Telegram Bot Token/).fill("wrong-telegram-bot-token");
            await page.getByLabel(/Telegram Chat ID/).fill(getEnv("E2E_NOTIFICATION_TELEGRAM_CHAT_ID"));
            await page.getByLabel(/Telegram Topic ID/).fill(getEnv("E2E_NOTIFICATION_TELEGRAM_TOPIC_ID"));
        });
        await submit(page);
        await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await testFromEdit(page, invalidChannelName);
        await expect(page.getByText("An error occurred while testing the notification channel, check your configuration")).toBeVisible();
        await cancel(page);
    });

    test("Delete invalid Telegram channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await remove(page, invalidChannelName);
        await expect(page.getByText("Notification channel has been successfully removed.")).toBeVisible();
        await expect(page.getByText(invalidChannelName)).toHaveCount(0);
    });
});
