import {Page} from "@playwright/test";


/**
 * Locate a project card in the list.
 *
 * Executes from: `/dashboard/projects`.
 */
export function get(page: Page, projectName: string) {
    return page.locator('a[href^="/dashboard/projects/"]').filter({hasText: projectName}).first();
}

/**
 * Create a project from the selected entrypoint.
 *
 * Available entrypoints:
 * - `emptyState`: the empty-state CTA.
 * - `button`: the classic create button.
 *
 * * Executes from: `/dashboard/projects`.
 */
export async function create(page: Page, entrypoint: "emptyState" | "button", projectName: string) {
    if (entrypoint === "emptyState") {
        await page.getByText("Create new Project", {exact: true}).click();
    } else {
        await page.getByRole("button", {name: /Create Project/i}).click();
    }

    await page.getByLabel("Name").fill(projectName);
    await page.getByRole("button", {name: "Create"}).click();
}

/**
 * Edit an existing project from its details page.
 *
 * Executes from: `/dashboard/projects/[projectId]`.
 */
export async function edit(page: Page, currentName: string, updatedName: string) {
    await get(page, currentName).click();

    await page
        .getByRole("button", {name: /Delete Project/i})
        .locator("xpath=ancestor::div[1]/preceding-sibling::div[1]/*[1]")
        .click();

    await page.getByLabel("Name").fill(updatedName);
    await page.getByRole("button", {name: "Update"}).click();
}

/**
 * Delete an existing project from its details page.
 *
 * Executes from: `/dashboard/projects/[projectId]`.
 * */
export async function remove(page: Page, projectName: string) {
    await get(page, projectName).click();
    await page.getByRole("button", {name: /Delete Project/i}).click();
    await page.getByRole("button", {name: "Delete", exact: true}).click();
}
