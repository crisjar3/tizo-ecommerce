import { delay, http, HttpResponse } from 'msw';
import type { JsonBodyType } from 'msw';

import type {
  ApiErrorEnvelope,
  CancellationRequest,
  CheckoutCommand,
  CreateCancellationCommand,
  OpsOrder,
  ResolveCancellationCommand,
} from '../app/core/api/api-contract';
import {
  buildCart,
  fingerprint,
  projectCustomerOrder,
  readDatabase,
  recalculateOrder,
  resetDatabase,
  updateDatabase,
} from './db';
import type { MockDatabase } from './db';

export type MockScenario = 'normal' | 'slow' | 'empty' | 'error' | 'offline' | 'uncertain';

export const MOCK_SCENARIO_KEY = 'tizo:mock-scenario:v1';

const ok = <T extends JsonBodyType>(body: T, status = 200) => HttpResponse.json(body, { status });

const apiError = (status: number, code: string, message: string) =>
  HttpResponse.json<ApiErrorEnvelope>(
    { code, message, correlationId: `corr-${crypto.randomUUID()}` },
    { status },
  );

async function preflight(): Promise<Response | null> {
  const scenario = (sessionStorage.getItem(MOCK_SCENARIO_KEY) ?? 'normal') as MockScenario;
  await delay(scenario === 'slow' ? 2_200 : 180);
  if (scenario === 'offline') return HttpResponse.error();
  if (scenario === 'error')
    return apiError(500, 'MOCK_SERVICE_ERROR', 'El servicio demo no está disponible.');
  return null;
}

function isEmptyScenario(): boolean {
  return sessionStorage.getItem(MOCK_SCENARIO_KEY) === 'empty';
}

function isUncertainScenario(): boolean {
  return sessionStorage.getItem(MOCK_SCENARIO_KEY) === 'uncertain';
}

function selectedOperatorName(request: Request, database: MockDatabase): string {
  const operatorId = request.headers.get('X-Operator-Id');
  return database.operators.find((operator) => operator.id === operatorId)?.name ?? 'Operador demo';
}

function withCurrentValidity(
  request: CancellationRequest,
  database: MockDatabase,
): CancellationRequest {
  if (request.status !== 'REQUESTED') return { ...request, validNow: false };
  const order = database.orders.find((candidate) => candidate.id === request.orderId);
  const items = order?.items.filter((item) => request.itemIds.includes(item.id)) ?? [];
  const validNow =
    Boolean(items.length) &&
    items.every((item) => item.cancellable && item.status !== 'DISPATCHED');
  return {
    ...request,
    validNow,
    invalidReason: validNow ? undefined : 'El estado de la orden cambió desde la solicitud.',
  };
}

function createCancellationResponse(
  command: CreateCancellationCommand,
  requesterName: string,
): Response {
  return updateDatabase((database) => {
    const scope = `create-cancellation:${command.orderId}`;
    const commandFingerprint = fingerprint(command);
    const previous = database.idempotency.find(
      (record) => record.scope === scope && record.key === command.idempotencyKey,
    );
    if (previous) {
      if (previous.fingerprint !== commandFingerprint) {
        return apiError(409, 'IDEMPOTENCY_KEY_REUSED', 'La clave ya fue usada con otros datos.');
      }
      return ok(previous.response as CancellationRequest);
    }

    const order = database.orders.find((candidate) => candidate.id === command.orderId);
    if (!order) return apiError(404, 'ORDER_NOT_FOUND', 'La orden solicitada no existe.');
    if (!command.reasonCode || command.itemIds.length === 0) {
      return apiError(422, 'VALIDATION_ERROR', 'Seleccioná productos y un motivo.');
    }
    if (order.items.some((item) => item.status === 'DISPATCHED' || item.status === 'DELIVERED')) {
      return apiError(
        409,
        'ORDER_ALREADY_DISPATCHED',
        'El paquete ya fue despachado. Corresponde tramitar una devolución.',
      );
    }
    if (
      database.requests.some(
        (candidate) =>
          candidate.orderId === order.id &&
          (candidate.status === 'REQUESTED' || candidate.status === 'COMPLETED'),
      )
    ) {
      return apiError(409, 'ORDER_ALREADY_HAS_CANCELLATION', 'La orden ya tiene una cancelación.');
    }

    const selectedItems = order.items.filter((item) => command.itemIds.includes(item.id));
    if (!selectedItems.length || selectedItems.some((item) => !item.cancellable)) {
      return apiError(409, 'NO_CANCELLABLE_ITEMS', 'No hay productos cancelables en esta orden.');
    }

    const request: CancellationRequest = {
      id: `C-${207 + database.requests.length}`,
      orderId: order.id,
      itemIds: selectedItems.map((item) => item.id),
      items: selectedItems.map((item) => ({
        itemId: item.id,
        name: item.name,
        store: item.store,
        amount: item.lineTotal,
        itemStatusBefore: item.status,
        operationalEffect: item.operationalEffect,
      })),
      status: 'REQUESTED',
      reasonCode: command.reasonCode,
      reasonNote: command.reasonNote,
      requestedAt: new Date().toISOString(),
      requesterName,
      affectedAmount: {
        amountMinor: selectedItems.reduce((sum, item) => sum + item.lineTotal.amountMinor, 0),
        currency: order.paidTotal.currency,
      },
      version: 1,
      validNow: true,
    };
    database.requests.unshift(request);
    database.audit.unshift({
      id: `audit-${crypto.randomUUID()}`,
      entityId: request.id,
      orderId: order.id,
      action: 'CANCELLATION_REQUESTED',
      actorName: requesterName,
      occurredAt: request.requestedAt,
      correlationId: `corr-${crypto.randomUUID()}`,
      summary: `Solicitud creada para ${selectedItems.length} producto(s).`,
    });
    database.idempotency.push({
      scope,
      key: command.idempotencyKey,
      fingerprint: commandFingerprint,
      status: 201,
      response: request,
    });
    return ok(request, 201);
  });
}

export const handlers = [
  http.get('/api/catalog/products', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    return ok(isEmptyScenario() ? [] : readDatabase().products);
  }),

  http.get('/api/catalog/products/:productId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const product = readDatabase().products.find(
      (candidate) => candidate.id === String(params['productId']),
    );
    return product ? ok(product) : apiError(404, 'PRODUCT_NOT_FOUND', 'El producto no existe.');
  }),

  http.get('/api/me/cart', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    return ok(buildCart(readDatabase()));
  }),

  http.put('/api/me/cart/items/:productId', async ({ params, request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const body = (await request.json()) as { quantity?: number };
    const productId = String(params['productId']);
    if (!Number.isInteger(body.quantity) || (body.quantity ?? 0) < 1) {
      return apiError(422, 'VALIDATION_ERROR', 'La cantidad debe ser mayor que cero.');
    }
    return updateDatabase((database) => {
      const product = database.products.find((candidate) => candidate.id === productId);
      if (!product) return apiError(404, 'PRODUCT_NOT_FOUND', 'El producto no existe.');
      if ((body.quantity ?? 0) > product.stock) {
        return apiError(409, 'INSUFFICIENT_STOCK', 'No hay stock suficiente para esa cantidad.');
      }
      const existing = database.cart.find((line) => line.productId === productId);
      if (existing) existing.quantity = body.quantity ?? 1;
      else database.cart.push({ productId, quantity: body.quantity ?? 1 });
      return ok(buildCart(database));
    });
  }),

  http.delete('/api/me/cart/items/:productId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    return updateDatabase((database) => {
      database.cart = database.cart.filter(
        (line) => line.productId !== String(params['productId']),
      );
      return ok(buildCart(database));
    });
  }),

  http.post('/api/me/orders', async ({ request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const command = (await request.json()) as CheckoutCommand;
    const response = updateDatabase((database) => {
      const commandFingerprint = fingerprint(command);
      const previous = database.idempotency.find(
        (record) => record.scope === 'checkout' && record.key === command.idempotencyKey,
      );
      if (previous) {
        if (previous.fingerprint !== commandFingerprint) {
          return apiError(409, 'IDEMPOTENCY_KEY_REUSED', 'La clave ya fue usada con otra compra.');
        }
        return ok(previous.response as JsonBodyType);
      }
      const cart = buildCart(database);
      if (!cart.items.length) return apiError(422, 'EMPTY_CART', 'El carrito está vacío.');

      const nextId = String(Math.max(...database.orders.map((order) => Number(order.id))) + 1);
      const order: OpsOrder = {
        id: nextId,
        createdAt: new Date().toISOString(),
        progress: 'CONFIRMED',
        customerName: 'Cliente demo',
        customerEmail: 'cliente@tizo.test',
        fulfillmentStatus: 'CONFIRMED',
        cancellationStatus: 'NONE',
        version: 1,
        paidTotal: cart.total,
        cancelledTotal: { amountMinor: 0, currency: cart.total.currency },
        activeTotal: cart.total,
        items: cart.items.map((line, index) => ({
          id: `item-${nextId}-${index + 1}`,
          productId: line.product.id,
          name: line.product.name,
          quantity: line.quantity,
          lineTotal: line.lineTotal,
          cancelled: false,
          refundStatus: 'NONE',
          sku: line.product.sku,
          store: line.product.store,
          status: 'CONFIRMED',
          cancellable: true,
          operationalEffect: 'La tienda libera la reserva antes de preparar el producto.',
        })),
      };
      database.orders.unshift(order);
      database.cart = [];
      const projection = projectCustomerOrder(order);
      database.idempotency.push({
        scope: 'checkout',
        key: command.idempotencyKey,
        fingerprint: commandFingerprint,
        status: 201,
        response: projection,
      });
      return ok(projection, 201);
    });
    return isUncertainScenario() ? HttpResponse.error() : response;
  }),

  http.get('/api/me/orders', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const orders = isEmptyScenario() ? [] : readDatabase().orders.map(projectCustomerOrder);
    return ok(orders);
  }),

  http.get('/api/me/orders/:orderId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const order = readDatabase().orders.find(
      (candidate) => candidate.id === String(params['orderId']),
    );
    return order
      ? ok(projectCustomerOrder(order))
      : apiError(404, 'ORDER_NOT_FOUND', 'El pedido no existe.');
  }),

  http.post('/api/me/orders/:orderId/cancellation-requests', async ({ params, request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const command = (await request.json()) as CreateCancellationCommand;
    const response = createCancellationResponse(
      { ...command, orderId: String(params['orderId']) },
      'Cliente demo',
    );
    return isUncertainScenario() ? HttpResponse.error() : response;
  }),

  http.get('/api/ops/operators', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    return ok(readDatabase().operators);
  }),

  http.get('/api/ops/orders', async ({ request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? '';
    const cancellation = url.searchParams.get('cancellation') ?? '';
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const items = isEmptyScenario()
      ? []
      : readDatabase().orders.filter(
          (order) =>
            (!status || order.fulfillmentStatus === status) &&
            (!cancellation || order.cancellationStatus === cancellation) &&
            (!search ||
              order.id.includes(search) ||
              order.customerName.toLowerCase().includes(search)),
        );
    return ok({ items, page: 1, total: items.length });
  }),

  http.get('/api/ops/orders/:orderId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const order = readDatabase().orders.find(
      (candidate) => candidate.id === String(params['orderId']),
    );
    return order ? ok(order) : apiError(404, 'ORDER_NOT_FOUND', 'La orden no existe.');
  }),

  http.post('/api/ops/cancellation-requests', async ({ request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const command = (await request.json()) as CreateCancellationCommand;
    const database = readDatabase();
    const response = createCancellationResponse(command, selectedOperatorName(request, database));
    return isUncertainScenario() ? HttpResponse.error() : response;
  }),

  http.get('/api/ops/cancellation-requests', async ({ request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const database = readDatabase();
    const status = new URL(request.url).searchParams.get('status') ?? '';
    const requests = isEmptyScenario()
      ? []
      : database.requests
          .filter((candidate) => !status || candidate.status === status)
          .map((candidate) => withCurrentValidity(candidate, database));
    return ok(requests);
  }),

  http.get('/api/ops/cancellation-requests/by-idempotency-key/:key', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const database = readDatabase();
    const record = database.idempotency.find(
      (candidate) => candidate.key === String(params['key']),
    );
    return record
      ? ok(record.response as JsonBodyType)
      : apiError(404, 'IDEMPOTENCY_RESULT_NOT_FOUND', 'Todavía no encontramos un resultado.');
  }),

  http.get('/api/ops/cancellation-requests/:requestId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const database = readDatabase();
    const request = database.requests.find(
      (candidate) => candidate.id === String(params['requestId']),
    );
    return request
      ? ok(withCurrentValidity(request, database))
      : apiError(404, 'REQUEST_NOT_FOUND', 'La solicitud no existe.');
  }),

  http.post('/api/ops/cancellation-requests/:requestId/approve', async ({ params, request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const command = (await request.json()) as ResolveCancellationCommand;
    const response = updateDatabase((database) => {
      const requestIndex = database.requests.findIndex(
        (candidate) => candidate.id === String(params['requestId']),
      );
      if (requestIndex < 0) return apiError(404, 'REQUEST_NOT_FOUND', 'La solicitud no existe.');
      const current = database.requests[requestIndex];
      if (!current) return apiError(404, 'REQUEST_NOT_FOUND', 'La solicitud no existe.');
      const scope = `approve:${current.id}`;
      const previous = database.idempotency.find(
        (record) => record.scope === scope && record.key === command.idempotencyKey,
      );
      if (previous) {
        if (previous.fingerprint !== fingerprint(command)) {
          return apiError(
            409,
            'IDEMPOTENCY_KEY_REUSED',
            'La clave ya fue usada con otra decisión.',
          );
        }
        return ok(previous.response as JsonBodyType);
      }
      if (current.status !== 'REQUESTED') {
        return apiError(409, 'REQUEST_ALREADY_RESOLVED', 'Otro operador ya resolvió la solicitud.');
      }
      if (current.version !== command.expectedVersion) {
        return apiError(
          409,
          'CONCURRENT_MODIFICATION',
          'La solicitud cambió mientras la revisabas.',
        );
      }
      const orderIndex = database.orders.findIndex((order) => order.id === current.orderId);
      const order = database.orders[orderIndex];
      if (!order) return apiError(404, 'ORDER_NOT_FOUND', 'La orden no existe.');
      const selected = order.items.filter((item) => current.itemIds.includes(item.id));
      if (selected.some((item) => item.status === 'DISPATCHED' || item.status === 'DELIVERED')) {
        database.requests[requestIndex] = {
          ...current,
          status: 'REJECTED',
          rejectionCode: 'ORDER_ALREADY_DISPATCHED',
          resolvedAt: new Date().toISOString(),
          resolverName: selectedOperatorName(request, database),
          validNow: false,
          version: current.version + 1,
        };
        return apiError(409, 'ORDER_ALREADY_DISPATCHED', 'El paquete ya fue despachado.');
      }
      const updatedOrder = recalculateOrder({
        ...order,
        items: order.items.map((item) =>
          current.itemIds.includes(item.id)
            ? {
                ...item,
                status: 'CANCELLED',
                cancelled: true,
                cancellable: false,
                refundStatus: 'SUCCEEDED',
              }
            : item,
        ),
      });
      database.orders[orderIndex] = updatedOrder;
      const completed: CancellationRequest = {
        ...current,
        status: 'COMPLETED',
        resolverName: selectedOperatorName(request, database),
        resolvedAt: new Date().toISOString(),
        effectiveOrderId: order.id,
        validNow: false,
        version: current.version + 1,
      };
      database.requests[requestIndex] = completed;
      database.audit.unshift({
        id: `audit-${crypto.randomUUID()}`,
        entityId: completed.id,
        orderId: order.id,
        action: 'CANCELLATION_COMPLETED',
        actorName: completed.resolverName ?? 'Operador demo',
        occurredAt: completed.resolvedAt ?? new Date().toISOString(),
        correlationId: `corr-${crypto.randomUUID()}`,
        summary: `Cancelación aplicada por ${completed.affectedAmount.amountMinor / 100} ARS.`,
      });
      database.idempotency.push({
        scope,
        key: command.idempotencyKey,
        fingerprint: fingerprint(command),
        status: 200,
        response: completed,
      });
      return ok(completed);
    });
    return isUncertainScenario() ? HttpResponse.error() : response;
  }),

  http.post('/api/ops/cancellation-requests/:requestId/reject', async ({ params, request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const command = (await request.json()) as ResolveCancellationCommand;
    const response = updateDatabase((database) => {
      const index = database.requests.findIndex(
        (candidate) => candidate.id === String(params['requestId']),
      );
      if (index < 0) return apiError(404, 'REQUEST_NOT_FOUND', 'La solicitud no existe.');
      const current = database.requests[index];
      if (!current) return apiError(404, 'REQUEST_NOT_FOUND', 'La solicitud no existe.');
      const scope = `reject:${current.id}`;
      const previous = database.idempotency.find(
        (record) => record.scope === scope && record.key === command.idempotencyKey,
      );
      if (previous) {
        if (previous.fingerprint !== fingerprint(command)) {
          return apiError(
            409,
            'IDEMPOTENCY_KEY_REUSED',
            'La clave ya fue usada con otra decisión.',
          );
        }
        return ok(previous.response as JsonBodyType);
      }
      if (current.status !== 'REQUESTED') {
        return apiError(409, 'REQUEST_ALREADY_RESOLVED', 'Otro operador ya resolvió la solicitud.');
      }
      const rejected: CancellationRequest = {
        ...current,
        status: 'REJECTED',
        resolverName: selectedOperatorName(request, database),
        resolvedAt: new Date().toISOString(),
        rejectionCode: command.rejectionCode ?? 'OPERATOR_REJECTED',
        rejectionNote: command.rejectionNote,
        validNow: false,
        version: current.version + 1,
      };
      database.requests[index] = rejected;
      database.audit.unshift({
        id: `audit-${crypto.randomUUID()}`,
        entityId: rejected.id,
        orderId: rejected.orderId,
        action: 'CANCELLATION_REJECTED',
        actorName: rejected.resolverName ?? 'Operador demo',
        occurredAt: rejected.resolvedAt ?? new Date().toISOString(),
        correlationId: `corr-${crypto.randomUUID()}`,
        summary: 'Solicitud rechazada; la orden no cambió.',
      });
      database.idempotency.push({
        scope,
        key: command.idempotencyKey,
        fingerprint: fingerprint(command),
        status: 200,
        response: rejected,
      });
      return ok(rejected);
    });
    return isUncertainScenario() ? HttpResponse.error() : response;
  }),

  http.get('/api/ops/cancellation-history', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    return ok(isEmptyScenario() ? [] : readDatabase().audit);
  }),

  http.post('/api/mock/reset', async () => ok(resetDatabase())),
];
