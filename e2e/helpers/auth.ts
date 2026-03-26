import {Page} from "@playwright/test";

export type UserCredentials = {
    username: string
    email: string
    password: string
}

export const users: Record<string, UserCredentials> = {
    admin: {username: "Admin", email: "admin@example.com", password: "testPASS123456!"},
    normal: {username: "John Doe", email: "john.doe@example.com", password: "testPASS123456!"},
}

/**
 * Fill and submit the registration form.
 *
 * Executes from: `/register`.
 */
export async function register(page: Page, name: string, email: string, password: string, confirmPassword: string) {
    await page.locator('input[name="name"]').fill(name)
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.locator('input[name="confirmPassword"]').fill(confirmPassword)

    await page.click('button[type="submit"]')
}

/**
 * Fill and submit the login form.
 *
 * Executes from: `/login`.
 */
export async function login(page: Page, email: string, password: string) {
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)

    await page.locator('button:has-text("Login")').click()
}

/**
 * Log out the current authenticated user.
 *
 * Executes from: any authenticated `/dashboard/**` page.
 */
export async function logout(page: Page) {
    const profileButton = page.getByTestId('profile-dropdown')
    await profileButton.first().click();

    await page.getByRole("menuitem").filter({hasText: /Logout/i}).click();
}
