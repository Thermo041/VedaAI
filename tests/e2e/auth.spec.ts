import { test, expect } from "@playwright/test";

test("signup and signin pages render", async ({ page }) => {
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: /Create teacher account/i })).toBeVisible();

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /Welcome back/i })).toBeVisible();
});
