import {Page} from "@playwright/test";


/**
 * Locate a storage channel card in the channels list.
 *
 * Executes from: `/dashboard/storages/channels`.
 */
export function get(page: Page, channelName: string) {
    return page.locator('div.block.transition-all.duration-200.rounded-xl', {
        has: page.locator('h3', {hasText: channelName}),
    }).first();
}

/**
 * Fill the storage channel creation form.
 *
 * Available entrypoints:
 * - `button`: the classic add button.
 * - `emptyState`: the empty-state CTA.
 * - `auto`: uses the classic add button and falls back to the empty-state CTA.
 *
 * Executes from: `/dashboard/storages/channels`.
 */
export async function create(
    page: Page,
    provider: "S3" | "Google Drive",
    channelName: string,
    fillConfig: (page: Page) => Promise<void>,
    entrypoint: "auto" | "emptyState" | "button" = "auto",
) {
    if (entrypoint === "auto") {
        const addButton = page.getByRole("button", {name: /Add storage channel/i});
        if (await addButton.isVisible()) await page.getByRole("button", {name: /Add storage channel/i}).click();
        else await page.getByText("No storage channels configured yet", {exact: true}).click();
    } else if (entrypoint === "button") {
        await page.getByRole("button", {name: /Add storage channel/i}).click();
    } else if (entrypoint === "emptyState") {
        await page.getByText("No storage channels configured yet", {exact: true}).click();
    }

    await page.getByText(provider, {exact: true}).click();
    await page.getByLabel(/Channel Name/).fill(channelName);
    await fillConfig(page);
}

/**
 * Open the edit dialog for an existing storage channel.
 *
 * Executes from: `/dashboard/storages/channels`.
 */
export async function edit(page: Page, channelName: string) {
    const card = get(page, channelName);
    await card.locator("button").nth(1).click();
}

/**
 * Delete an existing storage channel.
 *
 * Executes from: `/dashboard/storages/channels`.
 */
export async function remove(page: Page, channelName: string) {
    const card = get(page, channelName);
    await card.locator("button").nth(2).click();
    await page.getByRole("button", {name: "Delete"}).click();
}

/**
 * Trigger the storage connection test in the current dialog.
 *
 * Executes from: the add or edit storage channel dialog opened from `/dashboard/storages/channels`.
 */
export async function testConnection(page: Page) {
    await page.getByRole("button", {name: /Test Storage/i}).click();
}

/**
 * Submit the storage channel creation form.
 *
 * Executes from: the add storage channel dialog opened from `/dashboard/storages/channels`.
 */
export async function submit(page: Page) {
    await page.getByRole("button", {name: "Add Channel"}).click();
}

/**
 * Open the edit dialog for a storage channel and trigger the test action.
 *
 * Executes from: `/dashboard/storages/channels`.
 */
export async function testFromEdit(page: Page, channelName: string) {
    await edit(page, channelName);
    await testConnection(page);
}

/**
 * Close the current storage channel dialog without saving.
 *
 * Executes from: the add or edit storage channel dialog.
 */
export async function cancel(page: Page) {
    await page.getByRole("button", {name: "Cancel"}).click();
}
