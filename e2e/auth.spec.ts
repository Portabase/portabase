import {test, expect} from '@playwright/test';
import {login, register, users} from "./helpers/auth";
import {LOCAL_STORAGE_PATH} from "./helpers/session";

const TIMEOUT = 5000

test.use({storageState: LOCAL_STORAGE_PATH})

test.describe.serial( () => {

    test('Redirect to login if not connected', async ({page}) => {
        await page.goto('/dashboard/projects');
        await expect(page).toHaveURL("login?redirect=%2Fdashboard%2Fprojects", {timeout: TIMEOUT});
    });

    test('Password too short', async ({page}) => {
        await page.goto('')
        await page.click('text=Sign up')
        await expect(page).toHaveURL('/register')

        let password = '123456'
        await register(page, users["admin"].username, users["admin"].email, password, password)

        const toast = page.locator('text=Must have at least 8 character')
        await expect(toast).toBeVisible()
    })

    test('Password too simple', async ({page}) => {
        await page.goto('')
        await page.click('text=Sign up')
        await expect(page).toHaveURL('/register')

        let password = '12345678'
        await register(page, users["admin"].username, users["admin"].email, password, password)

        const toast = page.locator('text=Your password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.')
        await expect(toast).toBeVisible()
    })

    test('Password and confirm password mismatch', async ({page}) => {
        await page.goto('/')
        await page.click('text=Sign up')
        await expect(page).toHaveURL('/register')

        let password = 'testPASS123456!'
        let confirmPassword = 'testPASS123456!!'
        await register(page, users["admin"].username, users["admin"].email, password, confirmPassword)

        const toast = page.locator('text=The passwords did not match')
        await expect(toast).toBeVisible()
    })

    test('Successful register for admin', async ({page}) => {
        await page.goto('/')

        await page.click('text=Sign up')
        await expect(page).toHaveURL('/register')

        await register(page, users["admin"].username, users["admin"].email, users["admin"].password, users["admin"].password)

        await expect(page).toHaveURL('/login', {timeout: TIMEOUT})
    })

    test('User already exists.', async ({page}) => {
        await page.goto('/')

        await page.click('text=Sign up')
        await expect(page).toHaveURL('/register')

        await register(page, users["admin"].username, users["admin"].email, users["admin"].password, users["admin"].password)

        const toast = page.locator('text=User already exists. Use another email.')
        await expect(toast).toBeVisible()
    })

    test('Successful register for normal', async ({page}) => {
        await page.goto('/')

        await page.click('text=Sign up')
        await expect(page).toHaveURL('/register')

        await register(page, users["normal"].username, users["normal"].email, users["normal"].password, users["normal"].password)

        await expect(page).toHaveURL('login', {timeout: TIMEOUT})
    })

    test('Failed login because account not active', async ({page}) => {
        await page.goto('/login')
        await login(page, users["normal"].email, users["normal"].password)

        const toast = page.locator('text=Your account is not active.')
        await expect(toast).toBeVisible()
    })

    test('Successful login', async ({page}) => {
        await page.goto('/login')
        await login(page, users["admin"].email, users["admin"].password)

        await expect(page).toHaveURL('/dashboard/home', {timeout: TIMEOUT})
        await expect(page.getByRole('link', {name: 'Logo Portabase'})).toBeVisible()
        await page.context().storageState({path: LOCAL_STORAGE_PATH})
    })
})
