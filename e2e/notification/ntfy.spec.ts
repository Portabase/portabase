import {expect, test} from "@playwright/test";
import {
    cancel, create, get, remove, submit, testFromEdit,
} from "../helpers/notification";
import {getEnv} from "../helpers/env";
import {LOCAL_STORAGE_PATH} from "../helpers/session";

test.use({storageState: LOCAL_STORAGE_PATH});

const requiredChannelName = "Ntfy E2E Required";
const optionalChannelName = "Ntfy E2E Optional";
const invalidChannelName = "Ntfy E2E Invalid";

// test.describe.serial("Valid channels", () => {
//     test("Create and test a valid Ntfy channel with only required fields", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "ntfy.sh", requiredChannelName, async (page) => {
//             await page.getByLabel(/Topic Name/).fill(getEnv("E2E_NOTIFICATION_NTFY_TOPIC"));
//         });
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, requiredChannelName)).toBeVisible();
//         await testFromEdit(page, requiredChannelName);
//         await expect(page.getByText("Sent to ntfy")).toBeVisible();
//         await cancel(page);
//     });
//
//     test("Create and test a valid Ntfy channel with optional fields", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "ntfy.sh", optionalChannelName, async (page) => {
//             await page.getByLabel(/Topic Name/).fill(getEnv("E2E_NOTIFICATION_NTFY_TOPIC"));
//             await page.getByLabel(/^Server URL$/).fill(getEnv("E2E_NOTIFICATION_NTFY_SERVER_URL"));
//             await page.getByLabel(/^Access Token$/).fill(getEnv("E2E_NOTIFICATION_NTFY_TOKEN"));
//             await page.getByLabel(/^Basic Auth Username$/).fill(getEnv("E2E_NOTIFICATION_NTFY_USERNAME"));
//             await page.getByLabel(/^Basic Auth Password$/).fill(getEnv("E2E_NOTIFICATION_NTFY_PASSWORD"));
//         });
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, optionalChannelName)).toBeVisible();
//         await testFromEdit(page, optionalChannelName);
//         await expect(page.getByText("Sent to ntfy")).toBeVisible();
//         await cancel(page);
//     });
// });

test.describe.serial("Invalid channel", () => {
    test("Create and test invalid Ntfy channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await create(page, "ntfy.sh", invalidChannelName, async (page) => {
            await page.getByLabel(/Topic Name/).fill("wrong-ntfy-topic");
            await page.getByLabel(/^Server URL$/).fill(getEnv("E2E_NOTIFICATION_NTFY_SERVER_URL"));
            await page.getByLabel(/^Access Token$/).fill("wrong-ntfy-token");
        });
        await submit(page);
        await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await testFromEdit(page, invalidChannelName);
        await expect(page.getByText("An error occurred while testing the notification channel, check your configuration")).toBeVisible();
        await cancel(page);
    });

    test("Delete invalid Ntfy channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await remove(page, invalidChannelName);
        await expect(page.getByText("Notification channel has been successfully removed.")).toBeVisible();
        await expect(page.getByText(invalidChannelName)).toHaveCount(0);
    });
});
