import { test, expect } from '@playwright/test';

async function dragPart(page,id,slot){
  const source=page.locator(`[data-action="pick-part"][data-id="${id}"]`),target=page.locator(`[data-action="fit-target"][data-fit-slot="${slot}"]`);
  await source.scrollIntoViewIfNeeded();const a=await source.boundingBox(),b=await target.boundingBox();
  await page.mouse.move(a.x+a.width/2,a.y+a.height/2);await page.mouse.down();
  await page.mouse.move(b.x+b.width/2,b.y+b.height/2,{steps:15});await page.mouse.up();
}
test('physical assembly, part details, safe alternatives, and an isolated brake-fire demo',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.stack));
  await page.goto('/');await expect(page.locator('#scene')).toHaveAttribute('data-ready','true');
  await page.screenshot({path:'artifacts/workshop-desktop.png',fullPage:true});
  await dragPart(page,'offroad','wheels');
  await expect(page.locator('[data-action="fit-target"][data-fit-slot="wheels"]')).toContainText('Grooved tyres');
  await page.getByRole('button',{name:'Pick up Endurance tyres'}).focus();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:'Fit Endurance tyres to car',exact:true}).click();
  await expect(page.locator('[data-action="fit-target"][data-fit-slot="wheels"]')).toContainText('Endurance tyres');
  await page.getByRole('tab',{name:'Power',exact:true}).click();
  await page.getByRole('button',{name:'More details about Attack power unit'}).click();
  await expect(page.getByRole('dialog')).toContainText('THE COMPROMISE');
  await expect(page.getByRole('dialog')).toContainText('compact cooling');
  await page.screenshot({path:'artifacts/part-details.png',fullPage:true});
  await page.getByRole('button',{name:'Fit to car',exact:true}).click();
  await expect(page.locator('#engineering-panel')).toContainText('Limited cooling margin');
  await page.getByRole('button',{name:'Preview failures'}).click();
  await page.getByRole('button',{name:/Blocked brake duct/}).click();
  await expect(page.getByRole('dialog')).toContainText('uncooled sprint package');
  await page.getByRole('button',{name:'Watch the 18-second demo'}).click();
  await expect(page.locator('#demo-stage')).toContainText('BRAKE FIRE',{timeout:30000});
  await page.getByRole('button',{name:'Pause race'}).click();
  await expect(page.getByRole('button',{name:'Resume race'})).toBeVisible();
  await page.screenshot({path:'artifacts/incident-fire.png',fullPage:true});
  await page.getByRole('button',{name:'Skip animation'}).click();
  await expect(page.getByRole('heading',{name:'Your race starts in the garage.'})).toBeVisible();
  await expect(page.locator('#action-bar')).toContainText('2 practice runs left');
  await expect(page.locator('[data-action="fit-target"][data-fit-slot="power"]')).toContainText('Attack power unit');
  expect(errors).toEqual([]);
});
