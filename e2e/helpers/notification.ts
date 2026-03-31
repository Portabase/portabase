import {Page} from "@playwright/test";


/**
 * Locate a notification channel card in the list.
 *
 * Executes from: `/dashboard/notifications/channels`.
 */
export function get(page: Page, channelName: string) {
    return page.locator('div.block.transition-all.duration-200.rounded-xl', {
        has: page.locator('h3', {hasText: channelName}),
    }).first();
}

/**
 * Open the edit dialog for an existing notification channel.
 *
 * Executes from: `/dashboard/notifications/channels`.
 */
export async function edit(page: Page, channelName: string) {
    const card = get(page, channelName);
    await card.locator("button").nth(1).click();
}

/**
 * Delete an existing notification channel.
 *
 * Executes from: `/dashboard/notifications/channels`.
 */
export async function remove(page: Page, channelName: string) {
    const card = get(page, channelName);
    await card.locator("button").nth(2).click();
    await page.getByRole("button", {name: "Delete"}).click();
}

/**
 * Fill the notification channel creation form.
 *
 * Available entrypoints:
 * - `button`: the classic add button.
 * - `emptyState`: the empty-state CTA.
 * - `auto` use the classic add button and falls back to the empty-state CTA.
 *
 * Executes from: `/dashboard/notifications/channels`.
 */
export async function create(
    page: Page,
    provider: "Discord" | "Gotify" | "ntfy.sh" | "Slack" | "Email" | "Telegram" | "Webhook",
    channelName: string,
    fillConfig: (page: Page) => Promise<void>,
    entrypoint: "auto" | "emptyState" | "button" = "auto",
) {
    if (entrypoint === "auto") {
        const addButton = page.getByRole("button", {name: /Add notification channel/i});
        if (await addButton.isVisible()) await page.getByRole("button", {name: /Add notification channel/i}).click();
        else await page.getByRole("button", {name: /No notification channels configured yet/i}).click();
    } else if (entrypoint === "button") {
        await page.getByRole("button", {name: /Add notification channel/i}).click();
    } else if (entrypoint === "emptyState") {
        await page.getByRole("button", {name: /No notification channels configured yet/i}).click();
    }

    await page.getByText(provider, {exact: true}).click();
    await page.getByLabel(/Channel Name/).fill(channelName);
    await fillConfig(page);
}

/**
 * Submit the notification channel creation form.
 *
 * Executes from: the add notification channel dialog opened from `/dashboard/notifications/channels`.
 */
export async function submit(page: Page) {
    await page.getByRole("button", {name: "Add Channel"}).click();
}

/**
 * Open the edit dialog for a notification channel and trigger the test action.
 *
 * Executes from: `/dashboard/notifications/channels`.
 */
export async function testFromEdit(page: Page, channelName: string) {
    await edit(page, channelName);
    await page.getByRole("button", {name: /Test Channel/i}).click();
}

/**
 * Close the current notification channel dialog without saving.
 *
 * Executes from: the add or edit notification channel dialog.
 */
export async function cancel(page: Page) {
    await page.getByRole("button", {name: "Cancel"}).click();
}
