import { expect, test } from '@playwright/test';

test('login page renders the credential form', async ({ page }) => {
  await page.goto('/console/login');
  // The login form shows email + password inputs before any API call.
  await expect(page.getByLabel(/email|メール/i)).toBeVisible();
  await expect(page.getByRole('button')).toBeVisible();
});
