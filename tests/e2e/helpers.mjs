/**
 * Type text into a field by id.
 */
export async function typeText(page, id, text) {
  const el = page.locator(`#${id}`);
  await el.waitFor({ state: 'visible' });
  await el.click();
  await el.fill('');
  await page.keyboard.type(text, { delay: 5 });
}

/**
 * Click a button by id.
 */
export async function clickBtn(page, id) {
  const btn = page.locator(`#${id}`);
  await btn.waitFor({ state: 'visible' });
  await btn.click({ force: true });
}

/**
 * Get inner text of an element by id.
 */
export async function getText(page, id) {
  const el = page.locator(`#${id}`);
  await el.waitFor({ state: 'visible' });
  return el.innerText();
}
