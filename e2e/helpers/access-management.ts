import {Page} from "@playwright/test";

export function getUserRow(page: Page, email: string) {
    return page.locator("tr").filter({hasText: email}).first();
}

export function getOrganizationRow(page: Page, organizationName: string) {
    return page.locator("tr").filter({hasText: organizationName}).first();
}

/**
 * Create an organization from the selected entrypoint.
 *
 * Available entrypoints:
 * - `button`: the organizations page create button.
 * - `sidebar`: the sidebar organization switcher.
 *
 * Executes from:
 * - `/dashboard/admin/organizations` for "button" entrypoint
 * - any `/dashboard/**` page for "sidebar" entrypoint
 */
export async function create(page: Page, entrypoint: "button" | "sidebar", name: string) {
    if (entrypoint === "sidebar") {
        await page.getByRole("button", {name: "Default Organization"}).click();
        await page.getByText("Create organization", {exact: true}).click();
    } else {
        await page.getByRole("button", {name: /Create a new organization/i}).click();
    }

    await page.getByLabel("Name").fill(name);
    await page.getByRole("button", {name: "Create"}).click();
}

/**
 * Switch the active organization from the sidebar switcher.
 *
 * Executes from: any `/dashboard/**` if the sidebar is visible.
 */
export async function switchTo(page: Page, from: string, name: string) {
    await page.getByRole("button", {name: from}).click();
    await page.getByRole('menuitem', {name: name}).click();
}

/**
 * Switch back to the default organization.
 *
 * Executes from: any `/dashboard/**` if the sidebar is visible.
 */
export async function switchToDefault(page: Page, from: string) {
    await switchTo(page, from, "Default Organization");
}

const ROLE_LABELS = {
    pending: "Pending",
    user: "User",
    admin: "Admin",
} as const;

/**
 * Change the global role of a user from the admin users role modal.
 *
 * Executes from: the "Change the user's role" dialog opened from `/dashboard/admin/users`.
 */
export async function changeUserRole(page: Page, role: keyof typeof ROLE_LABELS) {
    const roleOption = ROLE_LABELS[role];

    await page.getByRole("combobox").click();
    await page.getByRole("option", {name: roleOption}).click();
    await page.getByRole("button", {name: "Validate"}).click();
}