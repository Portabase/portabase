import {expect, Locator, Page} from "@playwright/test";

export const backupDatabases = [
    {dbms: "postgresql", label: "postgresql"},
    {dbms: "mysql", label: "mysql"},
    {dbms: "mariadb", label: "mariadb"},
    {dbms: "mongodb", label: "mongodb"},
] as const;

/**
 * Attach all currently available databases to a new project.
 *
 * Executes from: `/dashboard/projects`.
 */
export async function createProjectWithAllDatabases(page: Page, projectName: string) {
    const createButton = page.getByRole("button", {name: /Create Project/i});
    if (await createButton.isVisible()) {
        await createButton.click();
    } else {
        await page.getByText("Create new Project", {exact: true}).click();
    }

    await page.getByLabel("Name").fill(projectName);
    await page.getByRole("button", {name: /Select databases/i}).click();
    await page.getByText("(Select All)", {exact: true}).click();
    await page.getByText("Close", {exact: true}).click();
    await page.getByRole("button", {name: "Create"}).click();
}

/**
 * Locate a project card in the list.
 *
 * Executes from: `/dashboard/projects`.
 */
export function getProject(page: Page, projectName: string) {
    return page.locator('a[href^="/dashboard/projects/"]').filter({hasText: projectName}).first();
}

/**
 * Open a database card from a project page using its dbms icon alt text.
 *
 * Executes from: `/dashboard/projects/[projectId]`.
 */
export async function openProjectDatabase(page: Page, dbms: string) {
    const databaseLink = page
        .locator('a[href*="/dashboard/projects/"][href*="/database/"]')
        .filter({has: page.getByAltText(`${dbms} icon`)})
        .first();

    await expect(databaseLink).toBeVisible({timeout: 120_000});
    await databaseLink.click();
}

/**
 * Wait until the given database detail page is interactive.
 *
 * Executes from: `/dashboard/projects/[projectId]/database/[databaseId]`.
 */
export async function waitForDatabasePage(page: Page, dbmsLabel: string) {
    await expect(page.getByRole("button", {name: /^Backup$/i})).toBeVisible({timeout: 120_000});
    await expect(page.getByText(dbmsLabel, {exact: true})).toBeVisible({timeout: 120_000});
}

/**
 * Trigger a manual backup and return the created backup row.
 *
 * Executes from: `/dashboard/projects/[projectId]/database/[databaseId]`.
 */
export async function createBackup(page: Page): Promise<Locator> {
    const backupRowsBefore = page.locator("tbody tr");
    const rowCountBefore = await backupRowsBefore.count();

    await page.getByRole("button", {name: /^Backup$/i}).click();
    await page.getByRole("button", {name: "Yes, create backup"}).click();

    await expect(page.getByText("Backup has been successfully created.")).toBeVisible({timeout: 120_000});

    const backupRows = page.locator("tbody tr");
    await expect(backupRows).toHaveCount(rowCountBefore + 1, {timeout: 120_000});

    return backupRows.first();
}

/**
 * Wait for a backup row to reach the success state.
 *
 * Executes from: `/dashboard/projects/[projectId]/database/[databaseId]`.
 */
export async function waitForBackupSuccess(backupRow: Locator) {
    await expect(backupRow.getByText("success", {exact: true})).toBeVisible({timeout: 120_000});
}

/**
 * Trigger a restore from the given backup row.
 *
 * Executes from: `/dashboard/projects/[projectId]/database/[databaseId]`.
 */
export async function createRestoreFromBackup(page: Page, backupRow: Locator) {
    await backupRow.getByRole("button", {name: /Open menu/i}).click();
    await page.getByRole("menuitem", {name: /Restore/i}).click();

    await expect(page.getByRole("heading", {name: /Restore backup \?/i})).toBeVisible({timeout: 120_000});

    const storageChoice = page.locator('button[type="button"]').filter({has: page.getByText(/local/i)}).first();
    await storageChoice.click();
    await page.getByRole("button", {name: "Confirm"}).click();

    await expect(page.getByText("Restoration has been successfully created.")).toBeVisible({timeout: 120_000});
}

/**
 * Wait for the latest restoration row to reach the success state.
 *
 * Executes from: `/dashboard/projects/[projectId]/database/[databaseId]?tab=restore`.
 */
export async function waitForRestoreSuccess(page: Page) {
    await page.getByRole("tab", {name: "Restoration"}).click();
    const restoreRows = page.locator("tbody tr");
    const latestRestoreRow = restoreRows.first();

    await expect(latestRestoreRow).toBeVisible({timeout: 120_000});
    await expect(latestRestoreRow.getByText("success", {exact: true})).toBeVisible({timeout: 120_000});
}
