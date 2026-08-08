import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { resetDemo } from './helpers';

for (const route of ['/shop', '/cart', '/orders', '/cancellations']) {
  test(`sin violaciones críticas o serias en ${route}`, async ({ page }) => {
    await resetDemo(page);
    await page.goto(route);
    await expect(page.locator('main')).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.filter((violation) =>
        ['critical', 'serious'].includes(violation.impact ?? ''),
      ),
    ).toEqual([]);
  });
}

test('no hay overflow horizontal al ancho mínimo', async ({ page }) => {
  await resetDemo(page);
  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of ['/shop', '/cart', '/orders', '/cancellations']) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  }
});
