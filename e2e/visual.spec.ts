import { expect, test } from '@playwright/test';

import { resetDemo } from './helpers';

const desktopCases = [
  { name: 'marketplace', route: '/shop' },
  { name: 'product-detail', route: '/shop/products/prod-running' },
  { name: 'cart', route: '/cart' },
  { name: 'customer-orders', route: '/my/orders' },
  { name: 'customer-order-detail', route: '/my/orders/1042' },
  { name: 'operator-selector', route: '/operator' },
  { name: 'ops-orders', route: '/orders' },
  { name: 'ops-order-detail', route: '/orders/1042' },
  { name: 'ops-cancel-form', route: '/orders/1042/cancel' },
  { name: 'cancellation-inbox-empty', route: '/cancellations' },
  { name: 'cancellation-detail-rejected', route: '/cancellations/C-206' },
  { name: 'cancellation-history', route: '/cancellations/history' },
  { name: 'operators-team', route: '/operators' },
  { name: 'not-found', route: '/404' },
] as const;

for (const visualCase of desktopCases) {
  test(`visual escritorio: ${visualCase.name}`, async ({ page }) => {
    await resetDemo(page);
    await page.goto(visualCase.route);
    await settleVisualPage(page);
    await expect(page).toHaveScreenshot(`${visualCase.name}-1280.png`, {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}

for (const visualCase of [
  { name: 'marketplace-mobile', route: '/shop' },
  { name: 'product-detail-mobile', route: '/shop/products/prod-running' },
  { name: 'cart-mobile', route: '/cart' },
  { name: 'operator-selector-mobile', route: '/operator' },
  { name: 'ops-orders-mobile', route: '/orders' },
  { name: 'cancellation-inbox-mobile', route: '/cancellations' },
  { name: 'cancellation-detail-mobile', route: '/cancellations/C-206' },
] as const) {
  test(`visual móvil: ${visualCase.name}`, async ({ page }) => {
    await resetDemo(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(visualCase.route);
    await settleVisualPage(page);
    await expect(page).toHaveScreenshot(`${visualCase.name}-390.png`, {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}

async function settleVisualPage(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.locator('main')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images]
        .filter((image) => !image.complete)
        .map(
          (image) =>
            new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            }),
        ),
    );
  });
  await page.waitForTimeout(250);
}
