import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

export async function resetDemo(page: Page): Promise<void> {
  await page.goto('/shop');
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.reload();
  await expect(page.getByText('Zapatillas running Nébula', { exact: true }).first()).toBeVisible();
}

export async function checkoutSeedCart(page: Page): Promise<string> {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Carrito', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar compra' }).click();
  await expect(page.getByText('¡Compra confirmada!')).toBeVisible();
  const match = page.url().match(/\/my\/orders\/(\d+)/);
  expect(match).not.toBeNull();
  return match?.[1] ?? '';
}
