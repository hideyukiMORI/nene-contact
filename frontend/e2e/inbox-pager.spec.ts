import { expect, test, type Page } from '@playwright/test';

// Verifies the 施主's original observation is cured: on the submissions inbox the pagination
// control is visible even at one page (<=20 rows), showing the range readout — the old numbered
// Pager returned null at pages<=1 and so was invisible. Network is stubbed (no live backend),
// so this exercises the same console source that produced the deployed bundle.

const FORM = {
  id: 3,
  name: 'お問い合わせ',
  public_form_key: 'k3',
  default_locale: 'ja',
  locales: ['ja'],
  status: 'active',
  fields: [],
};

function submission(id: number): Record<string, unknown> {
  return {
    id,
    contact_form_id: 3,
    status: 'open',
    field_values: { name: `送信者 ${String(id)}` },
    submitted_at: '2026-07-22 09:00:00',
  };
}

// Serve exactly `total` submissions honoring limit/offset, like the real API.
async function stubApi(page: Page, total: number): Promise<void> {
  await page.route('**/admin/auth/login', (route) =>
    route.fulfill({
      json: { token: 'e2e-jwt', role: 'admin', email: 'e2e@ayane.local', org_id: 1 },
    }),
  );
  await page.route('**/admin/contact-forms*', (route) =>
    route.fulfill({ json: { items: [FORM], total: 1 } }),
  );
  await page.route('**/admin/submissions*', (route) => {
    const url = new URL(route.request().url());
    const limit = Number(url.searchParams.get('limit') ?? '20');
    const offset = Number(url.searchParams.get('offset') ?? '0');
    const count = Math.max(0, Math.min(limit, total - offset));
    return route.fulfill({
      json: {
        items: Array.from({ length: count }, (_, i) => submission(offset + i + 1)),
        total,
        limit,
        offset,
        status_counts: { open: total },
      },
    });
  });
}

// Sign in, then reach the inbox by client-side navigation — a full page.goto() would reload
// the SPA and drop the in-memory JWT (fail-closed session), bouncing back to login.
async function signInToInbox(page: Page): Promise<void> {
  await page.goto('/console/login');
  await page.locator('#login-email').fill('e2e@ayane.local');
  await page.locator('#login-password').fill('irrelevant-stubbed');
  await page.getByRole('button', { name: 'ログイン', exact: true }).click();
  await page.getByRole('link', { name: /受信箱/ }).click();
}

test('inbox pagination shows the range at one page (<=20 rows)', async ({ page }) => {
  await stubApi(page, 20);
  await signInToInbox(page);

  await expect(page.getByText('送信者 1', { exact: true })).toBeVisible();

  // The cure: the range readout is visible even though there is only one page.
  await expect(page.getByText('1〜20件を表示（全20件）')).toBeVisible();
  await expect(page.getByRole('button', { name: '前へ' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '次へ' })).toBeDisabled();

  await page.screenshot({ path: 'e2e-artifacts/inbox-pager-20.png', fullPage: true });
});

test('inbox pagination advances a page when there is more than one', async ({ page }) => {
  await stubApi(page, 21);
  await signInToInbox(page);

  await expect(page.getByText('送信者 1', { exact: true })).toBeVisible();
  await expect(page.getByText('1〜20件を表示（全21件）')).toBeVisible();
  await expect(page.getByRole('button', { name: '次へ' })).toBeEnabled();

  await page.getByRole('button', { name: '次へ' }).click();
  await expect(page.getByText('送信者 21', { exact: true })).toBeVisible();
  await expect(page.getByText('21〜21件を表示（全21件）')).toBeVisible();

  await page.screenshot({ path: 'e2e-artifacts/inbox-pager-21-page2.png', fullPage: true });
});
