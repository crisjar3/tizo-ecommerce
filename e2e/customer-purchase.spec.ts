import { expect, test } from '@playwright/test';

import { checkoutSeedCart, resetDemo } from './helpers';

test('cliente compra y consulta el mismo pedido en ambas superficies', async ({ page }) => {
  await resetDemo(page);

  await page.getByText('Zapatillas running Nébula', { exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Zapatillas running Nébula' })).toBeVisible();
  await page.getByRole('button', { name: 'Agregar al carrito' }).click();
  await expect(page.getByRole('heading', { name: 'Carrito', exact: true })).toBeVisible();

  const orderId = await checkoutSeedCart(page);
  await expect(page.getByText(`Tu pedido #${orderId} ya está en marcha.`)).toBeVisible();

  await page.goto('/my/orders');
  await expect(page.getByText(`Pedido #${orderId}`)).toBeVisible();
  const customerOrderCard = page.locator('.order-card').filter({ hasText: `Pedido #${orderId}` });
  await expect(customerOrderCard.getByText('1 producto', { exact: true })).toBeVisible();
  await expect(customerOrderCard.getByText('Esperando tiendas', { exact: true })).toBeVisible();
  await expect(customerOrderCard.locator('.badge')).toHaveAttribute('data-tone', 'warning');
  await page.goto('/orders');
  await expect(page.getByText(`#${orderId}`, { exact: true })).toBeVisible();
});
