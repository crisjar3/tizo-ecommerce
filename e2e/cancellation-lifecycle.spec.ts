import { expect, test } from '@playwright/test';

import { checkoutSeedCart, resetDemo } from './helpers';

test('cliente solicita y operaciones aprueba sin exponer datos internos', async ({ page }) => {
  await resetDemo(page);
  const orderId = await checkoutSeedCart(page);

  await page.getByRole('link', { name: 'Solicitar cancelación' }).click();
  await page.getByRole('checkbox').first().check();
  await page.getByLabel('Motivo').selectOption('CUSTOMER_REQUEST');
  await page.getByLabel(/Nota/).fill('El cliente cambió de decisión.');
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page).toHaveURL(new RegExp(`/my/orders/${orderId}`));
  await expect(page.getByText('TOTAL VIGENTE')).toBeVisible();

  await page.goto('/operator');
  await page.getByRole('button', { name: /Mariana Sosa/ }).click();
  await page.goto('/cancellations');
  await expect(page.getByText(new RegExp(`Orden #${orderId}`))).toBeVisible();
  await page
    .getByText(new RegExp(`Orden #${orderId}`))
    .first()
    .click();

  await page.getByRole('button', { name: 'Aprobar cancelación' }).click();
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Caso resuelto')).toBeVisible();

  await page.goto(`/my/orders/${orderId}`);
  await expect(page.getByText('Este pedido fue cancelado')).toBeVisible();
  await expect(page.getByText('Reembolso simulado completado')).toBeVisible();
  await expect(page.getByText(/UrbanRun|CONFIRMED|hub/i)).toHaveCount(0);
});

test('una respuesta perdida se reconcilia sin duplicar la solicitud', async ({ page }) => {
  await resetDemo(page);
  await page.goto('/my/orders/1042/cancel');
  await page.getByRole('checkbox').first().check();
  await page.getByLabel('Motivo').selectOption('CUSTOMER_REQUEST');
  await page.getByLabel(/Nota/).fill('Prueba de resultado incierto.');
  await page.evaluate(() => sessionStorage.setItem('tizo:mock-scenario:v1', 'uncertain'));

  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page.getByText('No sabemos si se creó la solicitud')).toBeVisible();
  await page.getByRole('button', { name: 'Verificar resultado' }).click();
  await expect(page).toHaveURL(/\/my\/orders\/1042/);

  await page.evaluate(() => sessionStorage.setItem('tizo:mock-scenario:v1', 'normal'));
  await page.goto('/cancellations?status=REQUESTED');
  await expect(page.getByText('Orden #1042')).toHaveCount(1);
});

test('rechazar conserva la orden y permite una solicitud futura', async ({ page }) => {
  await resetDemo(page);
  await page.goto('/operator');
  await page.getByRole('button', { name: /Mariana Sosa/ }).click();
  await page.goto('/orders/1042/cancel');
  await page.getByRole('checkbox').first().check();
  await page.getByLabel('Motivo').selectOption('CUSTOMER_REQUEST');
  await page.getByLabel(/Nota/).fill('El caso requiere revisión operacional.');
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page).toHaveURL(/\/cancellations\/C-\d+\?requested=1$/);

  await page.getByRole('button', { name: 'Rechazar solicitud' }).click();
  await page.getByLabel('Motivo del rechazo').fill('La orden debe continuar sin cambios.');
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByText('Caso resuelto')).toBeVisible();
  await expect(page.getByText('Rechazada', { exact: true })).toBeVisible();

  await page.goto('/orders/1042');
  await expect(page.getByText('$ 128.400', { exact: true })).toHaveCount(2);
  await expect(page.getByText('$ 0', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Crear solicitud' }).click();
  await expect(page.getByRole('checkbox').first()).toBeEnabled();
});
