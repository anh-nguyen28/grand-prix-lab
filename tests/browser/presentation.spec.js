import { test, expect } from '@playwright/test';

test.use({reducedMotion:'no-preference'});

test('race presentation: driver names are separated and the lap display stays clear of controls', async ({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.stack));
  await page.goto('/');await page.getByRole('button',{name:'Drive to the garage'}).click();
  await page.getByRole('button',{name:'Ready to qualify'}).click();
  await page.getByRole('button',{name:'Continue without bonus'}).click();
  await expect(page.getByRole('button',{name:'Lock build & race'})).toBeVisible({timeout:30000});
  await page.getByRole('button',{name:'Lock build & race'}).click();
  await expect(page.locator('[data-action="boost"]')).toBeEnabled({timeout:30000});
  await page.getByRole('button',{name:'Circuit',exact:true}).last().click();
  await expect(page.locator('.driver-label')).toHaveCount(20);
  const layout=await page.evaluate(()=>{
    const labels=[...document.querySelectorAll('.driver-label:not([hidden]):not(.compact)')].map(label=>label.getBoundingClientRect());
    let overlaps=0;
    for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
      const a=labels[i],b=labels[j];if(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)overlaps++;
    }
    return {overlaps,hudBottom:document.querySelector('.broadcast-hud').getBoundingClientRect().bottom,controlsTop:document.querySelector('#action-bar').getBoundingClientRect().top};
  });
  expect(layout.overlaps).toBe(0);expect(layout.hudBottom).toBeLessThan(layout.controlsTop);
  await page.getByRole('button',{name:'Pause race'}).click();
  await expect(page.getByRole('button',{name:'Resume race'})).toBeVisible();
  const clock=await page.locator('#race-clock').textContent();
  await page.waitForTimeout(1200);
  expect(await page.locator('#race-clock').textContent()).toBe(clock);
  await expect(page.locator('[data-action="boost"]')).toBeDisabled();
  await page.getByRole('button',{name:'Resume race'}).click();
  await page.getByRole('button',{name:'Change playback speed'}).click();
  await expect(page.getByRole('button',{name:'Change playback speed'})).toHaveText('2×');
  await expect(page.locator('#incident-banner')).toContainText('YELLOW FLAG',{timeout:45000});
  await page.getByRole('button',{name:'Pause race'}).click();
  await expect(page.locator('#incident-banner')).toBeVisible();
  await page.screenshot({path:'artifacts/race-desktop.png',fullPage:true});
  await page.locator('[data-action="follow-incident"]').click();
  await expect(page.locator('[data-action="race-camera"].selected')).toHaveCount(0);
  await page.getByRole('button',{name:'Follow me',exact:true}).click();
  await expect(page.getByRole('button',{name:'Follow me',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.screenshot({path:'artifacts/race-follow.png',fullPage:true});
  const ranks=await page.locator('.timing-row').evaluateAll(rows=>rows.map(row=>({rank:Number(row.dataset.position),transform:getComputedStyle(row).transform})));
  expect(ranks.some((row,i)=>row.rank!==i+1)).toBe(true);
  expect(ranks.every(row=>row.transform!=='none')).toBe(true);
  expect(await page.locator('.timing-row').first().evaluate(row=>parseFloat(getComputedStyle(row).transitionDuration))).toBeGreaterThan(0);
  await page.getByRole('button',{name:'Skip to finish'}).click();
  await expect(page.locator('.standings>div')).toHaveCount(20);
  await expect(page.locator('.podium>div')).toHaveCount(3);
  expect(errors).toEqual([]);
});
