import { test, expect } from '@playwright/test';

test('Test car plays one solo simulation with its incidents live, and it can be watched again', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.stack));
  await page.goto('/');await page.getByRole('button',{name:'Drive to the garage'}).click();
  await page.getByRole('button', { name: /Tracks/ }).click();
  await page.locator('.season-card[data-track="mountain"]').click();
  await page.getByRole('button', { name: /Test car/ }).click();
  await page.getByRole('button', { name: 'Continue without bonus' }).click();
  // One simulation names the run and walks through the incidents as the car meets them.
  await expect(page.locator('#demo-caption')).toContainText('PRACTICE RUN 01');
  const speed = page.getByRole('button', { name: 'Change playback speed' });
  await speed.click(); await speed.click(); // 2×
  await expect(page.locator('#demo-caption')).toContainText(/Cold tyres|Running wide|Aquaplaning|Crash/, { timeout: 60000 });
  await expect(page.locator('.incident-pop:not([hidden])').first()).toBeVisible();
  await expect(page.locator('.incident-pop:not([hidden])').first()).toContainText(/\+\d+\.\ds/);
  await page.getByRole('button', { name: 'Skip animation' }).click();
  await expect(page.locator('.run-time')).toBeVisible({ timeout: 30000 });
  // The same simulation can be watched again from the report.
  await page.getByRole('button', { name: 'Watch run again' }).click();
  await expect(page.locator('#demo-caption')).toContainText('PRACTICE RUN 01');
  await page.getByRole('button', { name: 'Skip animation' }).click();
  await expect(page.locator('.run-time')).toBeVisible({ timeout: 30000 });
  expect(errors).toEqual([]);
});

test('the race risks list offers Fix it only: the Test car lap is the one place to watch problems', async ({ page }) => {
  await page.goto('/');await page.getByRole('button',{name:'Drive to the garage'}).click();
  await page.getByRole('button', { name: /Test car/ }).click();
  await page.getByRole('button', { name: 'Continue without bonus' }).click();
  await page.getByRole('button', { name: 'Skip animation' }).click();
  await expect(page.locator('.race-risks .risk').first()).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.race-risks [data-action="fix-risk"]').first()).toBeVisible();
  await expect(page.locator('.race-risks [data-action="incident-demo"]')).toHaveCount(0);
  await expect(page.locator('.race-risks').getByRole('button', { name: 'Watch', exact: true })).toHaveCount(0);
});
