import {expect, test} from "@playwright/test";
import {
    cancel, create, get, remove, submit, testFromEdit,
} from "../helpers/notification";
import {getEnv} from "../helpers/env";
import {LOCAL_STORAGE_PATH} from "../helpers/session";

test.use({storageState: LOCAL_STORAGE_PATH});

const validChannelName = "Discord E2E Required";
const invalidChannelName = "Discord E2E Invalid";

// test.describe.serial("Valid channel", () => {
//     test("Create and test a valid Discord channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "Discord", validChannelName, async (page) => {
//             await page.getByLabel(/Discord Webhook URL/).fill(getEnv("E2E_NOTIFICATION_DISCORD_WEBHOOK"));
//         });
//         await expect(page.getByRole("heading", {name: "Add Notification Channel"})).toBeVisible();
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, validChannelName)).toBeVisible();
//
//         await testFromEdit(page, validChannelName);
//         await expect(page.getByRole("heading", {name: "Edit Notification Channel"})).toBeVisible();
//         await expect(page.getByText("Sent to Discord")).toBeVisible();
//         await cancel(page);
//         await expect(page.getByRole("heading", {name: "Edit Notification Channel"})).toHaveCount(0);
//     });
//
//     test("Edit and test a valid Discord channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await expect(get(page, validChannelName)).toBeVisible();
//         await testFromEdit(page, validChannelName);
//         await expect(page.getByRole("heading", {name: "Edit Notification Channel"})).toBeVisible();
//         await expect(page.getByText("Sent to Discord")).toBeVisible();
//         await cancel(page);
//         await expect(page.getByRole("heading", {name: "Edit Notification Channel"})).toHaveCount(0);
//     });
// });

test.describe.serial("Invalid channel", () => {
    test("Create and test invalid Discord channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await create(page, "Discord", invalidChannelName, async (page) => {
            await page.getByLabel(/Discord Webhook URL/).fill("https://discord.com/api/webhooks/123456789012345678/wrong-discord-webhook-token");
        });
        await expect(page.getByRole("heading", {name: "Add Notification Channel"})).toBeVisible();
        await submit(page);
        await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();

        await testFromEdit(page, invalidChannelName);
        await expect(page.getByRole("heading", {name: "Edit Notification Channel"})).toBeVisible();
        await expect(page.getByText("An error occurred while testing the notification channel, check your configuration")).toBeVisible();
        await cancel(page);
        await expect(page.getByRole("heading", {name: "Edit Notification Channel"})).toHaveCount(0);
    });

    test("Delete invalid Discord channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await remove(page, invalidChannelName);
        await expect(page.getByText("Notification channel has been successfully removed.")).toBeVisible();
        await expect(page.getByText(invalidChannelName)).toHaveCount(0);
    });
});
