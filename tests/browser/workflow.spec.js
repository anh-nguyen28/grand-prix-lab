import { test, expect } from '@playwright/test';

test('desktop: scan, predict, improve, qualify, adjust, race, and reveal', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.stack));
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  await page.screenshot({ path: 'artifacts/workshop-desktop.png', fullPage: true });
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'Scan mystery section' }).click(); await expect(page.locator('.clue.revealed')).toHaveCount(i + 1); }
  await page.getByRole('button', { name: 'Abrasive', exact: true }).click();
  await page.getByRole('button', { name: 'Lock in my label' }).click();
  await expect(page.locator('.notes-body')).toHaveAttribute('data-chapter', 'train');
  await page.locator('[data-action="view-chapter"][data-chapter="label"]').click();
  await expect(page.locator('.prediction')).toContainText('LOCKED');
  await page.getByRole('button', { name: /Test car/ }).click();
  await expect(page.locator('.run-time')).toBeVisible({ timeout: 30000 });
  const first = await page.locator('.run-time strong').textContent();
  await expect(page.locator('.race-risks')).toContainText('Tyres shredded');
  await page.locator('.race-risks [data-action="fix-risk"][data-type="tyreshred"]').click();
  await expect(page.locator('.shelf-part.is-suggested').first()).toBeVisible();
  await page.locator('[data-action="pick-part"][data-id="hard"]').dblclick();
  await expect(page.locator('[data-action="fit-target"][data-fit-slot="wheels"]')).toContainText('Hard tyres');
  await page.getByRole('button', { name: /Test car/ }).click();
  await expect(page.locator('.run-time .positive')).toBeVisible({ timeout: 30000 });
  expect(await page.locator('.run-time strong').textContent()).not.toEqual(first);
  await expect(page.getByRole('button', { name: /Test car/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Ready to qualify' }).click();
  await expect(page.getByRole('heading', { name: 'A little feedback. A better build.' })).toBeVisible({ timeout: 30000 });
  await page.getByRole('tab', { name: 'Power' }).click();
  await page.getByRole('button',{name:'Pick up Attack power unit'}).click();
  await page.getByRole('button',{name:'Fit Attack power unit to car',exact:true}).click();
  await expect(page.locator('#action-bar')).toContainText('1 slot changes available');
  await page.getByRole('button', { name: 'Lock build & race' }).click();
  await expect(page.locator('.driver-label')).toHaveCount(20);
  await expect(page.locator('.timing-row')).toHaveCount(20);
  await expect(page.locator('[data-driver="you"]')).toContainText('You');
  await expect(page.locator('[data-action="boost"]')).toBeEnabled({ timeout: 30000 });
  await page.locator('[data-action="boost"]').click();
  await expect(page.locator('#ers-charges')).toHaveText('2/3');
  await expect(page.locator('[data-action="boost"]')).toBeDisabled();
  await page.locator('#chat-input').fill('Good luck, you idiot');
  await page.locator('#chat-input').press('Enter');
  await expect(page.locator('.chat-msg.you')).toContainText('Good luck, you •••••');
  await expect(page.locator('#chat-input')).toHaveValue('');
  await expect(page.locator('.chat-msg.control').first()).toContainText('Lights out');
  await expect(page.locator('.chat-msg.rival').first()).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: 'artifacts/race-desktop.png', fullPage: true });
  await expect(page.getByRole('heading', { name: 'Every run teaches you something.' })).toBeVisible({ timeout: 280000 });
  await expect(page.locator('.score-breakdown')).toContainText('+3');
  await expect(page.locator('.lesson-title')).toContainText('classification');
  await expect(page.locator('.standings>div')).toHaveCount(20);
  await page.screenshot({ path: 'artifacts/results-desktop.png', fullPage: true });
  await expect(page.locator('.race-debrief .reel-item').first()).toBeVisible();
  await page.locator('[data-action="replay"]').first().click();
  await expect(page.locator('#demo-caption')).toContainText('REPLAY');
  await page.getByRole('button', { name: 'Skip animation' }).click();
  await expect(page.locator('#demo-caption')).toBeHidden();
  await page.getByRole('button', { name: /Tracks/ }).click();
  await expect(page.locator('.season-card')).toHaveCount(3);
  await expect(page.locator('.season-card[data-track="mountain"]')).toBeDisabled();
  await page.screenshot({ path: 'artifacts/season-desktop.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('mobile: layout, accessible help, setup, and prediction warning', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your race starts in the garage.' })).toBeVisible();
  await expect(page.locator('#scene')).toHaveAttribute('data-ready', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/workshop-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'How to play' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Set up your garage' }).click();
  await page.getByLabel('Driver name', { exact: true }).fill('Tiny Torque');
  await page.getByRole('button', { name: 'Enter your garage' }).click();
  await expect(page.locator('#profile-label')).toHaveText('Tiny Torque');
  await page.getByRole('button',{name:'Pick up Grooved tyres'}).click();
  await page.getByRole('button',{name:'Fit Grooved tyres to car',exact:true}).click();
  await expect(page.locator('[data-action="fit-target"][data-fit-slot="wheels"]')).toContainText('Grooved tyres');
  await page.getByRole('button', { name: /Test car/ }).click();
  await expect(page.getByRole('dialog')).toContainText('This answer does not change the car');
  await page.getByRole('button', { name: 'Continue without bonus' }).click();
  await expect(page.locator('.run-time')).toBeVisible({ timeout: 30000 });
  await page.locator('[data-action="view-chapter"][data-chapter="label"]').click();
  await expect(page.locator('.notes-body')).toHaveAttribute('data-chapter', 'label');
  await expect(page.locator('.prediction')).toContainText('No prediction submitted');
  await page.getByRole('button', { name: 'Ready to qualify' }).click();
  await expect(page.getByRole('button', { name: 'Lock build & race' })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Lock build & race' }).click();
  await expect(page.locator('[data-driver="you"]')).toContainText('Tiny Torque');
  await expect(page.locator('.driver-label')).toHaveCount(20);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const raceViewport = await page.evaluate(() => ({
    trackTop: document.querySelector('.scene-card').getBoundingClientRect().top,
    trackBottom: document.querySelector('.scene-card').getBoundingClientRect().bottom,
    controlsTop: document.querySelector('#action-bar').getBoundingClientRect().top,
    controlsBottom: document.querySelector('#action-bar').getBoundingClientRect().bottom,
    height: innerHeight,
  }));
  // Scroll positions round to device pixels while layout bounds retain fractions.
  expect(raceViewport.trackTop).toBeGreaterThanOrEqual(-1);
  expect(raceViewport.trackBottom).toBeLessThanOrEqual(raceViewport.controlsTop);
  expect(raceViewport.controlsBottom).toBeLessThanOrEqual(raceViewport.height);
  await expect(page.locator('[data-action="boost"]')).toBeEnabled({ timeout: 30000 });
  await page.locator('[data-action="boost"]').click();
  await expect(page.locator('#ers-charges')).toHaveText('2/3');
  await page.screenshot({ path: 'artifacts/race-mobile-viewport.png' });
  await page.screenshot({ path: 'artifacts/race-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Skip to finish' }).click();
  await expect(page.locator('.standings>div')).toHaveCount(20);
});

test('choosing a track changes the header, clues and mystery question', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.stack));
  await page.goto('/');
  await expect(page.locator('#round-title')).toHaveText('Dune Valley');
  await page.getByRole('button', { name: 'Scan mystery section' }).click();
  await expect(page.locator('.clue.revealed')).toHaveCount(1);
  await page.getByRole('button', { name: /Tracks/ }).click();
  await expect(page.locator('.season-card')).toHaveCount(3);
  await page.locator('.season-card[data-track="mountain"]').click();
  await expect(page.locator('#round-title')).toHaveText('Mountain Pass');
  await expect(page.locator('.clue.revealed')).toHaveCount(0);
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'Scan mystery section' }).click(); await expect(page.locator('.clue.revealed')).toHaveCount(i + 1); }
  await expect(page.locator('.clue.revealed').first()).toContainText(/water/i);
  await expect(page.getByRole('button', { name: 'Rain', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
