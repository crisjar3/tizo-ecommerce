import { expect, test } from '@playwright/test';

const OFFICIAL_API = 'https://d39uqv4p1mtopj.cloudfront.net/api';

test('las superficies de lectura consumen la API oficial', async ({ page }) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await openWithSuccessfulApiRead(page, '/shop', '/catalog/products');
  await expect(
    page.getByRole('heading', { name: 'Encontrá algo que te acompañe todos los días.' }),
  ).toBeVisible();
  await expect(page.locator('a[href^="/shop/products/"]')).not.toHaveCount(0);

  await openWithSuccessfulApiRead(page, '/cart', '/me/cart');
  await expect(page.getByRole('heading', { name: 'Carrito', exact: true })).toBeVisible();

  await openWithSuccessfulApiRead(page, '/my/orders', '/me/orders');
  await expect(page.getByRole('heading', { name: 'Mis pedidos', exact: true })).toBeVisible();

  await openWithSuccessfulApiRead(page, '/operator', '/ops/operators');
  await expect(page.getByRole('heading', { name: '¿Quién está operando?' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Ana Operaciones/ })).toBeVisible();

  await openWithSuccessfulApiRead(page, '/orders', '/ops/orders');
  await expect(page.getByRole('heading', { name: 'Órdenes', exact: true })).toBeVisible();

  expect(browserErrors, browserErrors.join('\n')).toEqual([]);
});

async function openWithSuccessfulApiRead(
  page: import('@playwright/test').Page,
  route: string,
  endpoint: string,
): Promise<void> {
  const responsePromise = page.waitForResponse(
    (response) => response.url().startsWith(`${OFFICIAL_API}${endpoint}`),
    { timeout: 20_000 },
  );
  await page.goto(route);
  const response = await responsePromise;
  expect(response.status(), `${endpoint} respondió ${response.status()}`).toBe(200);
}
