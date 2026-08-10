import { expect, test } from '@playwright/test';

import { resetDemo } from './helpers';

test('offline conserva el formulario y bloquea el comando', async ({ context, page }) => {
  await resetDemo(page);
  await page.goto('/my/orders/1042/cancel');
  await page.getByRole('checkbox').first().check();
  await page.getByLabel('Motivo').selectOption('CUSTOMER_REQUEST');
  await page.getByLabel(/Nota/).fill('Conservar esta explicación sin conexión.');

  await context.setOffline(true);
  await expect(page.getByText('Sin conexión.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled();
  await expect(page.getByLabel(/Nota/)).toHaveValue('Conservar esta explicación sin conexión.');

  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Enviar solicitud' })).toBeEnabled();
});

test('despacho concurrente impide aprobar y conserva la solicitud', async ({ page }) => {
  await resetDemo(page);
  await page.goto('/my/orders/1042/cancel');
  await page.getByRole('checkbox').first().check();
  await page.getByLabel('Motivo').selectOption('CUSTOMER_REQUEST');
  await page.getByLabel(/Nota/).fill('Solicitud válida antes del despacho.');
  await page.getByRole('button', { name: 'Enviar solicitud' }).click();
  await expect(page).toHaveURL(/\/my\/orders\/1042\?requested=1$/);

  const requestInfo = await page.evaluate(() => {
    const storageKey = 'tizo:mock-db:v1';
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) throw new Error('La base simulada no está inicializada.');
    const database = JSON.parse(raw) as {
      requests: Array<{ id: string; orderId: string; status: string; version: number }>;
      orders: Array<{
        id: string;
        version: number;
        dispatchedAt: string | null;
        fulfillmentStatus: string;
        items: Array<{ id: string; status: string; cancellable: boolean }>;
      }>;
    };
    const order = database.orders.find((candidate) => candidate.id === '1042');
    const item = order?.items.find((candidate) => candidate.id === 'item-1042-1');
    if (!order || !item) throw new Error('No se encontró la línea seed.');
    item.status = 'DISPATCHED';
    item.cancellable = false;
    order.dispatchedAt = new Date().toISOString();
    order.fulfillmentStatus = 'DISPATCHED';
    sessionStorage.setItem(storageKey, JSON.stringify(database));
    const request = database.requests.find(
      (candidate) => candidate.orderId === '1042' && candidate.status === 'PENDING',
    );
    if (!request) throw new Error('No se encontró la solicitud recién creada.');
    return {
      requestId: request.id,
      requestVersion: request.version,
      orderVersion: order.version,
    };
  });

  await page.goto('/operator');
  await page.getByRole('button', { name: /Mariana Sosa/ }).click();
  await page.goto(`/cancellations/${requestInfo.requestId}`);
  await expect(page.getByRole('button', { name: 'Aprobar cancelación' })).toBeDisabled();
  await expect(page.getByText(/la orden cambió/i)).toBeVisible();

  const conflict = await page.evaluate(async (info) => {
    const response = await fetch(`/api/ops/cancellation-requests/${info.requestId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Operator-Id': 'op-mariana' },
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        expectedRequestVersion: info.requestVersion,
        expectedOrderVersion: info.orderVersion,
      }),
    });
    return {
      status: response.status,
      body: (await response.json()) as { error: { code: string } },
    };
  }, requestInfo);

  expect(conflict.status).toBe(409);
  expect(conflict.body.error.code).toBe('ORDER_ALREADY_DISPATCHED');

  await page.goto(`/cancellations/${requestInfo.requestId}`);
  await expect(page.getByText('Rechazada', { exact: true })).toBeVisible();
});

test('reutilizar una clave idempotente con otro payload devuelve conflicto', async ({ page }) => {
  await resetDemo(page);

  const result = await page.evaluate(async () => {
    const idempotencyKey = crypto.randomUUID();
    const raw = sessionStorage.getItem('tizo:mock-db:v1');
    if (!raw) throw new Error('La base simulada no está inicializada.');
    const database = JSON.parse(raw) as { orders: Array<{ id: string; version: number }> };
    const order = database.orders.find((candidate) => candidate.id === '1042');
    if (!order) throw new Error('No se encontró la orden seed.');
    const firstPayload = {
      orderId: '1042',
      itemIds: ['item-1042-1'],
      reasonCode: 'CUSTOMER_REQUEST',
      reasonNote: 'Primer payload.',
      idempotencyKey,
      expectedOrderVersion: order.version,
    };
    const headers = { 'Content-Type': 'application/json', 'X-Operator-Id': 'op-mariana' };
    const first = await fetch('/api/ops/cancellation-requests', {
      method: 'POST',
      headers,
      body: JSON.stringify(firstPayload),
    });
    const second = await fetch('/api/ops/cancellation-requests', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...firstPayload, reasonNote: 'Payload diferente.' }),
    });
    return {
      firstStatus: first.status,
      secondStatus: second.status,
      secondBody: (await second.json()) as { error: { code: string } },
    };
  });

  expect(result.firstStatus).toBe(201);
  expect(result.secondStatus).toBe(409);
  expect(result.secondBody.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
});
