import {test, expect, Page} from '@playwright/test';


type UserCredentials = {
    username: string
    email: string
    password: string
}


const users: Record<string, UserCredentials> = {
    admin: {username: 'Admin', email: 'admin5@example.com', password: 'testPASS123456!'},
    normal: {username: 'John Doe', email: 'john5@example.comm', password: 'testPASS123456!'},
}

async function register(page: Page, name: string, email: string, password: string, confirmPassword: string) {
    await page.locator('input[name="name"]').fill(name)
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)
    await page.locator('input[name="confirmPassword"]').fill(confirmPassword)

    await page.click('button[type="submit"]')
}

async function login(page: Page, email: string, password: string) {
    await page.locator('input[name="email"]').fill(email)
    await page.locator('input[name="password"]').fill(password)

    // await page.click('button[type="submit"]')
    await page.locator('button:has-text("Login")').click()
    // await page.click('text=Login')
}

async function logout() {
}

test.describe.serial('User signup and login flows', () => {

    test('Redirect to login if not connected', async ({page}) => {
        await page.goto('dashboard/projects');
        await expect(page).toHaveURL("login?redirect=%2Fdashboard%2Fprojects");
    });

    test('Password too short', async ({page}) => {
        await page.goto('')
        await page.click('text=Sign up')
        await expect(page).toHaveURL('register')

        let password = '123456'
        await register(page, users["admin"].username, users["admin"].email, password, password)

        const toast = page.locator('text=Must have at least 8 character')
        await expect(toast).toBeVisible()
    })

    test('Password too simple', async ({page}) => {
        await page.goto('')
        await page.click('text=Sign up')
        await expect(page).toHaveURL('register')

        let password = '12345678'
        await register(page, users["admin"].username, users["admin"].email, password, password)

        const toast = page.locator('text=Your password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.')
        await expect(toast).toBeVisible()
    })

    test('Password and confirm password mismatch', async ({page}) => {
        await page.goto('')
        await page.click('text=Sign up')
        await expect(page).toHaveURL('register')

        let password = 'testPASS123456!'
        let confirmPassword = 'testPASS123456!!'
        await register(page, users["admin"].username, users["admin"].email, password, confirmPassword)

        const toast = page.locator('text=The passwords did not match')
        await expect(toast).toBeVisible()
    })

    test('Successful register for admin', async ({page}) => {
        await page.goto('')

        await page.click('text=Sign up')
        await expect(page).toHaveURL('register')

        await register(page, users["admin"].username, users["admin"].email, users["admin"].password, users["admin"].password)

        await expect(page).toHaveURL('login')
    })

    test('User already exists.', async ({page}) => {
        await page.goto('')

        await page.click('text=Sign up')
        await expect(page).toHaveURL('register')

        await register(page, users["admin"].username, users["admin"].email, users["admin"].password, users["admin"].password)

        const toast = page.locator('text=User already exists. Use another email.')
        await expect(toast).toBeVisible()
    })

    test('Successful register for normal', async ({page}) => {
        await page.goto('')

        await page.click('text=Sign up')
        await expect(page).toHaveURL('register')

        await register(page, users["normal"].username, users["normal"].email, users["normal"].password, users["normal"].password)

        await expect(page).toHaveURL('login')
    })

    test('Failed login because account not active', async ({page}) => {
        await page.goto('login')
        await login(page, users["normal"].email, users["normal"].password)

        const toast = page.locator('text=Your account is not active.')
        await expect(toast).toBeVisible()
    })

    test('Successful login', async ({page}) => {
        await page.goto('login')
        await login(page, users["admin"].email, users["admin"].password)

        await expect(page).toHaveURL('dashboard')
    })

})


test('Successful logout', async ({page}) => {
    await logout()
    await expect(page).toHaveURL('login')
})