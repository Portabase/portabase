import {expect, test} from "@playwright/test";
import {getEnv} from "../helpers/env";
import {
    cancel, create, get, remove, submit, testFromEdit,
} from "../helpers/notification";
import {LOCAL_STORAGE_PATH} from "../helpers/session";

test.use({storageState: LOCAL_STORAGE_PATH});

const validChannelName = "SMTP E2E Required";
const invalidChannelName = "SMTP E2E Invalid";
const successMessage = `Email sent: ${getEnv("E2E_NOTIFICATION_SMTP_TO")}`;

// test.describe.serial("Valid channel", () => {
//     test("Create and test a valid SMTP channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await create(page, "Email", validChannelName, async (page) => {
//             await page.getByLabel(/SMTP Host/).fill(getEnv("E2E_NOTIFICATION_SMTP_HOST"));
//             await page.getByLabel(/SMTP Port/).fill(getEnv("E2E_NOTIFICATION_SMTP_PORT"));
//             await page.getByLabel(/Username/).fill(getEnv("E2E_NOTIFICATION_SMTP_USER"));
//             await page.getByLabel(/Password/).fill(getEnv("E2E_NOTIFICATION_SMTP_PASSWORD"));
//             await page.getByLabel(/From Email/).fill(getEnv("E2E_NOTIFICATION_SMTP_FROM"));
//             await page.getByLabel(/To Email/).fill(getEnv("E2E_NOTIFICATION_SMTP_TO"));
//         });
//         await submit(page);
//         await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
//         await expect(get(page, validChannelName)).toBeVisible();
//         await testFromEdit(page, validChannelName);
//         await expect(page.getByText(successMessage)).toBeVisible();
//         await cancel(page);
//     });
//
//     test("Edit and test a valid SMTP channel", async ({page}) => {
//         await page.goto("/dashboard/notifications/channels");
//         await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
//         await expect(get(page, validChannelName)).toBeVisible();
//         await testFromEdit(page, validChannelName);
//         await expect(page.getByText(successMessage)).toBeVisible();
//         await cancel(page);
//     });
// });

test.describe.serial("Invalid channel", () => {
    test("Create and test invalid SMTP E2E channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await create(page, "Email", invalidChannelName, async (page) => {
            await page.getByLabel(/SMTP Host/).fill("smtp.invalid");
            await page.getByLabel(/SMTP Port/).fill(getEnv("E2E_NOTIFICATION_SMTP_PORT"));
            await page.getByLabel(/Username/).fill(getEnv("E2E_NOTIFICATION_SMTP_USER"));
            await page.getByLabel(/Password/).fill("wrong-password");
            await page.getByLabel(/From Email/).fill(getEnv("E2E_NOTIFICATION_SMTP_FROM"));
            await page.getByLabel(/To Email/).fill(getEnv("E2E_NOTIFICATION_SMTP_TO"));
        });
        await submit(page);
        await expect(page.getByText("Notification channel has been successfully created.")).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await testFromEdit(page, invalidChannelName);
        await expect(page.getByText("An error occurred while testing the notification channel, check your configuration")).toBeVisible();
        await cancel(page);
    });

    test("Delete invalid SMTP channel", async ({page}) => {
        await page.goto("/dashboard/notifications/channels");
        await expect(page.getByRole("heading", {name: "Notification channels"})).toBeVisible();
        await expect(get(page, invalidChannelName)).toBeVisible();
        await remove(page, invalidChannelName);
        await expect(page.getByText("Notification channel has been successfully removed.")).toBeVisible();
        await expect(page.getByText(invalidChannelName)).toHaveCount(0);
    });
});
