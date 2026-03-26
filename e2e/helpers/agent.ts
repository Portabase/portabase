import {Page} from "@playwright/test";


/**
 * Locate an agent card in the list.

 * Executes from: `/dashboard/agents`.
 */
export function get(page: Page, name: string) {
    return page.locator('a[href^="/dashboard/agents"]').filter({hasText: name}).first();
}

/**
 * Create an agent from the selected entrypoint.
 *
 * Available entrypoints:
 * - `button`: the classic create button.
 * - `emptyState`: the empty-state CTA.
 * - `auto`: uses the classic create button and falls back to the empty-state CTA.
 *
 * Executes from: `/dashboard/agents`.
 */
export async function create(page: Page, entrypoint: "auto" | "emptyState" | "button" = "auto", agentName: string, description: string) {
    if (entrypoint === "auto") {
        const createButton = page.getByRole("button", {name: /Create Agent/i});
        if (await createButton.isVisible()) await page.getByRole("button", {name: /Create Agent/i}).click();
        await page.getByText("Create new Agent", {exact: true}).click();
    } else if (entrypoint === "button") {
        await page.getByRole("button", {name: /Create Agent/i}).click();
    } else if (entrypoint === "emptyState") {
        await page.getByText("Create new Agent", {exact: true}).click();
    }

    await page.getByLabel("Name").fill(agentName);
    await page.getByLabel("Description").fill(description);
    await page.getByRole("button", {name: "Create"}).click();
}

/**
 * Edit an existing agent (name and description) from its details page.
 *
 * Executes from: `/dashboard/agents/[agentId]`.
 */
export async function edit(page: Page, currentName: string, updatedName: string, updatedDescription: string) {
    await get(page, currentName).click();

    await page
        .getByRole("button", {name: /Delete Agent/i})
        .locator("xpath=ancestor::div[1]/preceding-sibling::div[1]/*[1]")
        .click();

    await page.getByLabel("Name").fill(updatedName);
    await page.getByLabel("Description").fill(updatedDescription);
    await page.getByRole("button", {name: "Update"}).click();
}

/**
 * Delete an agent from its details page.

 * Executes from: `/dashboard/agents/[agentId]`.
 */
export async function remove(page: Page, name: string) {
    await get(page, name).click();
    await page.getByRole("button", {name: /Delete Agent/i}).click();
    await page.getByRole("button", {name: "Delete", exact: true}).click();
}
