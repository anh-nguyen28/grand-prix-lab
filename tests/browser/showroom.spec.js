import { test, expect } from '@playwright/test';

test('showroom: pick a livery before the garage and keep it on the car', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.stack));
  await page.goto('/');
  await expect(page.getByRole('dialog', { name: 'Make it yours.' })).toBeVisible();
  await expect(page.locator('#showroom-scene')).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: 'artifacts/showroom-desktop.png' });
  await page.getByLabel('Driver name', { exact: true }).fill('Blue Flash');
  await page.getByRole('button', { name: /McLaren/ }).click();
  await expect(page.locator('#showroom-team-label')).toContainText('McLaren');
  await page.getByRole('button', { name: /Your own team/ }).click();
  await page.getByRole('button', { name: 'Drive to the garage' }).click();
  await expect(page.locator('#showroom')).toBeVisible();
  await page.getByLabel('Team name').fill('Night Shift');
  await expect(page.locator('#showroom-team-label')).toContainText('Night Shift');
  await page.getByRole('button', { name: 'Electric blue' }).click();
  await page.getByRole('button', { name: 'Metallic' }).click();
  await page.getByRole('button', { name: 'Gold' }).click();
  await page.getByRole('button', { name: 'Twin stripe' }).click();
  await page.getByLabel('Race number').fill('44');
  await expect(page.locator('#showroom-driver')).toHaveText('Blue Flash');
  await expect(page.locator('#showroom-number')).toHaveText('44');
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'artifacts/showroom-custom.png' });
  await page.getByRole('button', { name: 'Drive to the garage' }).click();
  await expect(page.locator('#showroom')).toBeHidden();
  await expect(page.locator('#profile-label')).toHaveText('Blue Flash');
  await expect(page.locator('#rover-title')).toContainText('CAR 44 · NIGHT SHIFT');
  // Reopening shows the saved choices; Escape leaves them unchanged.
  await page.getByRole('button', { name: 'Showroom', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Electric blue' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Hot pink' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#showroom')).toBeHidden();
  await page.getByRole('button', { name: 'Showroom', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Electric blue' })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('showroom: the chosen F1 team badge rides on the car and shows during the race', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.stack));
  await page.goto('/');
  await page.getByRole('button', { name: /Ferrari/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'artifacts/showroom-team.png' });
  await page.getByRole('button', { name: 'Drive to the garage' }).click();
  await expect(page.locator('#rover-title')).toContainText('FERRARI');
  await page.getByRole('button', { name: 'Ready to qualify' }).click();
  await page.getByRole('button', { name: 'Continue without bonus' }).click();
  await expect(page.getByRole('button', { name: 'Lock build & race' })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Lock build & race' }).click();
  await expect(page.locator('.timing-row.is-you .tower-logo')).toHaveAttribute('aria-label', 'Ferrari');
  await expect(page.locator('.hud-you .team-logo')).toBeVisible();
  await expect(page.locator('[data-action="boost"]')).toBeEnabled({ timeout: 30000 });
  await expect(page.locator('.driver-label.is-you .label-logo')).toHaveCount(1);
  await page.screenshot({ path: 'artifacts/race-team-logo.png' });
  expect(errors).toEqual([]);
});

test('showroom: mobile layout fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('#showroom-scene')).toHaveAttribute('data-ready', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/showroom-mobile.png' });
  await page.getByRole('button', { name: 'Drive to the garage' }).click();
  await expect(page.locator('#showroom')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
