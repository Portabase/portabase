import {test} from "@playwright/test";
import fs from "fs";
import {LOCAL_STORAGE_PATH} from "./helpers/session";

test.describe(() => {
    test.beforeAll(async () => {
        if (fs.existsSync(LOCAL_STORAGE_PATH)) fs.unlinkSync(LOCAL_STORAGE_PATH);
        fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify({}));
    });

    test("Prepare shared storage state", async () => {
    });
});
