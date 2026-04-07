import {expect, test} from "@playwright/test";
import {
    cancel, create, get, remove, submit, testFromEdit,
} from "../helpers/notification";
import {getEnv} from "../helpers/env";
import {LOCAL_STORAGE_PATH} from "../helpers/session";

test.use({storageState: LOCAL_STORAGE_PATH});

const validChannelName = "Slack E2E Required";
const invalidChannelName = "Slack E2E Invalid";

// test.describe.serial("Valid channel", () => {
//     test("Create and test a valid Slack channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "Slack", validChannelName, async (page) => {
//             await page.getByLabel(/Slack Webhook URL/).fill(getEnv("E2E_NOTIFICATION_SLACK_WEBHOOK"));
//         });
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, validChannelName)).toBeVisible();
//         await testFromEdit(page, validChannelName);
//         await expect(page.getByText("Sent to Slack")).toBeVisible();
//         await cancel(page);
//     });
//
//     test("Edit and test a valid Slack E2E channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await expect(get(page, validChannelName)).toBeVisible();
//         await testFromEdit(page, validChannelName);
//         await expect(page.getByText("Sent to Slack")).toBeVisible();
//         await cancel(page);
//     });
// });

test.describe.serial("Invalid channel", () => {
    test("Create and test invalid Slack channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await create(page, "Slack", invalidChannelName, async (page) => {
            await page.getByLabel(/Slack Webhook URL/).fill("https://WRONG_SLACK_WEBHOOK");
        });
        await submit(page);
        await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await testFromEdit(page, invalidChannelName);
        await expect(page.getByText("An error occurred while testing the notification channel, check your configuration")).toBeVisible();
        await cancel(page);
    });

    test("Delete invalid Slack channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await remove(page, invalidChannelName);
        await expect(page.getByText("Notification channel has been successfully removed.")).toBeVisible();
        await expect(page.getByText(invalidChannelName)).toHaveCount(0);
    });
});
