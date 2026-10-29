import { test, expect } from '@playwright/test';

test('a scored race shows cooling failure, brake fire, retirement and zero finishing points', async ({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.stack));
  await page.goto('/');await page.getByRole('button',{name:'Drive to the garage'}).click();
  await page.getByRole('tab',{name:'Power',exact:true}).click();
  await page.getByRole('button',{name:'Pick up Uncooled sprint package'}).click();
  await page.getByRole('button',{name:'Fit Uncooled sprint package to car',exact:true}).click();
  await expect(page.locator('#engineering-panel')).toContainText('retires on lap 5');
  await page.getByRole('button',{name:'Ready to qualify'}).click();
  await page.getByRole('button',{name:'Continue without bonus'}).click();
  await expect(page.getByRole('button',{name:'Lock build & race'})).toBeVisible({timeout:30000});
  await page.getByRole('button',{name:'Lock build & race'}).click();
  await page.getByRole('button',{name:'Change playback speed'}).click();
  const player=page.locator('[data-driver-row="you"]');
  await expect(player).toContainText('HOT',{timeout:80000});
  // The incident page pauses the race and explains the problem while the loading bar runs for the time lost.
  const incidentPage=page.locator('#incident-page');
  await expect(incidentPage).toBeVisible();await expect(incidentPage).toContainText('Power unit overheating');await expect(incidentPage).toContainText('Your car · Lap');await expect(incidentPage).not.toContainText('Next time');await expect(incidentPage).toContainText('Losing');
  await expect(page.getByRole('button',{name:'Resume race'})).toBeAttached();
  await page.screenshot({path:'artifacts/race-incident-page.png'});
  await page.getByRole('button',{name:'Continue'}).click();await expect(incidentPage).toBeHidden();
  await expect(player).toContainText('FIRE',{timeout:100000});
  await expect(incidentPage).toContainText('Blocked brake duct');await expect(incidentPage).toContainText('Stopping the car');await expect(incidentPage).toContainText('OUT');
  await page.waitForTimeout(1500);
  await page.screenshot({path:'artifacts/race-fire.png',fullPage:true});
  await page.keyboard.press('Escape');await expect(incidentPage).toBeHidden();
  await expect(player).toContainText('RETIRED',{timeout:20000});
  await expect(page.locator('[data-action="boost"]')).toBeDisabled();
  await expect(page.locator('#your-position')).toHaveText('OUT');
  await expect(page.locator('#race-radio')).toContainText('Your car has retired');
  await page.getByRole('button',{name:'Pause race'}).click();
  await page.screenshot({path:'artifacts/race-retired.png',fullPage:true});
  await page.getByRole('button',{name:'Skip to finish'}).click();
  await expect(page.locator('.standings>.is-you')).toContainText('RETIRED');
  await expect(page.locator('.score-breakdown>div').first()).toContainText('+0');
  await expect(page.locator('.race-debrief').first()).toContainText('RETIRED');
  expect(errors).toEqual([]);
});
