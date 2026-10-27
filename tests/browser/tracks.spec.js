import { test, expect } from '@playwright/test';

test('a full race on Mountain Pass classifies everyone, shows crashes and aquaplaning, and retires nobody', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.stack));
  await page.goto('/');await page.getByRole('button',{name:'Drive to the garage'}).click();
  await page.getByRole('button', { name: /Tracks/ }).click();
  await page.locator('.season-card[data-track="mountain"]').click();
  await expect(page.locator('#round-title')).toHaveText('Mountain Pass');
  await page.getByRole('button', { name: /Test car/ }).click();
  await page.getByRole('button', { name: 'Continue without bonus' }).click();
  await page.getByRole('button', { name: 'Skip animation' }).click();
  await expect(page.locator('.section-forecast')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.track-chip')).toHaveCount(5);
  await page.getByRole('button', { name: 'Ready to qualify' }).click();
  await expect(page.getByRole('button', { name: 'Lock build & race' })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Lock build & race' }).click();
  await expect(page.locator('.timing-row')).toHaveCount(20);
  await expect(page.locator('#race-zone')).toContainText(/Shaded climb|Switchback|Waterfall|Summit|Downhill/, { timeout: 30000 });
  await page.getByRole('button', { name: 'Skip to finish' }).click();
  await expect(page.getByRole('heading', { name: 'Every run teaches you something.' })).toBeVisible({ timeout: 60000 });
  await expect(page.locator('.standings>div')).toHaveCount(20);
  await expect(page.locator('.standings')).not.toContainText('RETIRED');
  await expect(page.locator('.race-debrief').first()).toContainText(/Crash|Aquaplaning|Running wide|Cold tyres/);
  await page.screenshot({ path: 'artifacts/results-mountain.png', fullPage: true });
  expect(errors).toEqual([]);
});
