import {expect, test} from "@playwright/test";
import {create, edit, get, remove} from "./helpers/project";
import {LOCAL_STORAGE_PATH} from "./helpers/session";

test.use({storageState: LOCAL_STORAGE_PATH});

const project = {
    emptyStateName: "Project A",
    buttonName: "Project B",
    updatedButtonName: "Project B Updated",
};

test.describe.serial(() => {
    test("Create a project from empty state", async ({page}) => {
        await page.goto("/dashboard/projects");
        await expect(page.getByRole("heading", {name: "Projects"})).toBeVisible();
        await expect(page.getByText("Create new Project", {exact: true})).toBeVisible();

        await create(page, "emptyState", project.emptyStateName);

        await expect(page.getByText("Project has been successfully created.")).toBeVisible();
        await expect(get(page, project.emptyStateName)).toBeVisible();
        await expect(page.getByText("Create new Project", {exact: true})).toHaveCount(0);
    });

    test("Create a project from classic button", async ({page}) => {
        await page.goto("/dashboard/projects");
        await expect(page.getByRole("heading", {name: "Projects"})).toBeVisible();
        await expect(get(page, project.emptyStateName)).toBeVisible();

        await create(page, "button", project.buttonName);

        await expect(page.getByText("Project has been successfully created.")).toBeVisible();
        await expect(get(page, project.buttonName)).toBeVisible();
    });

    test("Edit the second created project", async ({page}) => {
        await page.goto("/dashboard/projects");
        await expect(page.getByRole("heading", {name: "Projects"})).toBeVisible();
        await expect(get(page, project.buttonName)).toBeVisible();

        await edit(page, project.buttonName, project.updatedButtonName);

        await expect(page.getByText("Project has been successfully updated.")).toBeVisible();
        await expect(page.getByText(project.updatedButtonName, {exact: true})).toBeVisible();
    });

    test("Delete the second created project", async ({page}) => {
        await page.goto("/dashboard/projects");
        await expect(page.getByRole("heading", {name: "Projects"})).toBeVisible();
        await expect(get(page, project.updatedButtonName)).toBeVisible();

        await remove(page, project.updatedButtonName);

        await expect(page).toHaveURL("/dashboard/projects");
        await expect(page.getByText("Projects has been successfully archived.")).toBeVisible();
        await expect(page.getByText(project.updatedButtonName)).toHaveCount(0);
    });
});
