import {expect, test} from "@playwright/test";
import fs from "fs";
import {logout} from "./helpers/auth";
import {LOCAL_STORAGE_PATH} from "./helpers/session";

test.use({storageState: LOCAL_STORAGE_PATH});

test.describe( () => {
    test.afterAll(async () => {
        if (fs.existsSync(LOCAL_STORAGE_PATH)) {
            fs.unlinkSync(LOCAL_STORAGE_PATH);
        }
    });

    test("Remove shared storage state", async ({page}) => {
        await test.step("Logout shared authenticated session", async () => {
            if (!fs.existsSync(LOCAL_STORAGE_PATH)) {
                return;
            }

            const content = fs.readFileSync(LOCAL_STORAGE_PATH, "utf-8").trim();
            if (!content || content === "{}") {
                return;
            }

            await page.goto('/dashboard/home');
            await logout(page);
            await expect(page).toHaveURL(/\/login(?:\?.*)?$/);
        });
    });
});
