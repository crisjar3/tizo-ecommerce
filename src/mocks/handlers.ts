import { delay, http, HttpResponse } from 'msw';
import type { JsonBodyType } from 'msw';

import type {
  CancellationRequest,
  CheckoutCommand,
  CreateCancellationCommand,
  OpsOrder,
  ResolveCancellationCommand,
} from '../app/core/api/api-contract';
import { MOCK_SCENARIO_KEY } from '../app/core/demo/mock-scenario';
import type { MockScenario } from '../app/core/demo/mock-scenario';
import {
  buildCart,
  fingerprint,
  readDatabase,
  recalculateOrder,
  resetDatabase,
  updateDatabase,
} from './db';
import type { MockDatabase } from './db';
import {
  pagination,
  toCancellationDetail,
  toCancellationSummary,
  toCart,
  toCustomerOrderDetail,
  toCustomerOrderSummary,
  toHistory,
  toOperator,
  toOpsOrderDetail,
  toOpsOrderSummary,
  toProductDetail,
  toProductSummary,
} from './official-projections';

const ok = <T extends JsonBodyType>(body: T, status = 200) => HttpResponse.json(body, { status });

const apiError = (status: number, code: string, message: string) =>
  HttpResponse.json(
    {
      type: `https://tizo.test/problems/${code.toLowerCase().replaceAll('_', '-')}`,
      title: message,
      status,
      detail: message,
      instance: '/api',
      error: {
        category:
          status === 404
            ? 'NOT_FOUND'
            : status === 409
              ? 'CONFLICT'
              : status === 422
                ? 'VALIDATION'
                : 'INTERNAL',
        code,
        message,
        correlationId: `corr-${crypto.randomUUID()}`,
        retryable: status >= 500,
        recoveryAction: status >= 500 ? 'RELOAD' : 'NONE',
      },
    },
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
  if (request.status !== 'PENDING') return { ...request, validNow: false };
  const order = database.orders.find((candidate) => candidate.id === request.orderId);
  const items = order?.items.filter((item) => request.itemIds.includes(item.id)) ?? [];
  const validNow =
    Boolean(items.length) &&
    order?.dispatchedAt === null &&
    items.every((item) => item.cancellable);
  return {
    ...request,
    validNow,
    invalidReason: validNow ? undefined : 'El estado de la orden cambió desde la solicitud.',
  };
}

function createCancellationResponse(
  command: CreateCancellationCommand,
  requesterName: string,
  audience: 'customer' | 'ops',
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
      const previousRequest = previous.response as CancellationRequest;
      return audience === 'customer'
        ? ok(customerReceipt(previousRequest, command.idempotencyKey, false))
        : ok({
            request: toCancellationDetail(previousRequest, database),
            idempotencyKey: command.idempotencyKey,
            created: false,
          });
    }

    const order = database.orders.find((candidate) => candidate.id === command.orderId);
    if (!order) return apiError(404, 'ORDER_NOT_FOUND', 'La orden solicitada no existe.');
    if (
      typeof command.expectedOrderVersion === 'number' &&
      command.expectedOrderVersion !== order.version
    ) {
      return apiError(409, 'CONCURRENT_MODIFICATION', 'La orden cambiÃ³ mientras la revisabas.');
    }
    if (!command.reasonCode || command.itemIds.length === 0) {
      return apiError(422, 'VALIDATION_ERROR', 'Seleccioná productos y un motivo.');
    }
    if (order.dispatchedAt !== null) {
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
          (candidate.status === 'PENDING' || candidate.status === 'COMPLETED'),
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
      status: 'PENDING',
      reasonCode: command.reasonCode,
      reasonNote: command.reasonNote,
      requestedAt: new Date().toISOString(),
      requesterName,
      affectedAmount: {
        amountMinor: selectedItems.reduce((sum, item) => sum + item.lineTotal.amountMinor, 0),
        currency: order.paidTotal.currency,
      },
      version: 1,
      currentOrderVersion: order.version,
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
    return audience === 'customer'
      ? ok(customerReceipt(request, command.idempotencyKey, true), 201)
      : ok(
          {
            request: toCancellationDetail(request, database),
            idempotencyKey: command.idempotencyKey,
            created: true,
          },
          201,
        );
  });
}

function customerReceipt(request: CancellationRequest, idempotencyKey: string, created: boolean) {
  return {
    requestId: request.id,
    orderId: request.orderId,
    status: 'PENDING' as const,
    itemIds: [...request.itemIds],
    affectedAmount: request.affectedAmount,
    requestedAt: request.requestedAt,
    idempotencyKey,
    created,
  };
}

export const handlers = [
  http.get('/api/catalog/products', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const items = isEmptyScenario() ? [] : readDatabase().products.map(toProductSummary);
    return ok({ items, pagination: pagination(items.length) });
  }),

  http.get('/api/catalog/products/:productId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const product = readDatabase().products.find(
      (candidate) => candidate.id === String(params['productId']),
    );
    return product
      ? ok(toProductDetail(product))
      : apiError(404, 'PRODUCT_NOT_FOUND', 'El producto no existe.');
  }),

  http.get('/api/me/cart', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    return ok(toCart(buildCart(readDatabase())));
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
      return ok(toCart(buildCart(database)));
    });
  }),

  http.delete('/api/me/cart/items/:productId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    return updateDatabase((database) => {
      database.cart = database.cart.filter(
        (line) => line.productId !== String(params['productId']),
      );
      return new HttpResponse(null, { status: 204 });
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
        const previousOrder = previous.response as OpsOrder;
        return ok({
          order: toCustomerOrderDetail(previousOrder, database),
          idempotencyKey: command.idempotencyKey,
          created: false,
        });
      }
      const cart = buildCart(database);
      if (!cart.items.length) return apiError(422, 'CART_EMPTY', 'El carrito está vacío.');

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
        dispatchedAt: null,
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
      database.idempotency.push({
        scope: 'checkout',
        key: command.idempotencyKey,
        fingerprint: commandFingerprint,
        status: 201,
        response: order,
      });
      return ok(
        {
          order: toCustomerOrderDetail(order, database),
          idempotencyKey: command.idempotencyKey,
          created: true,
        },
        201,
      );
    });
    return isUncertainScenario() ? HttpResponse.error() : response;
  }),

  http.get('/api/me/orders', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const orders = isEmptyScenario() ? [] : readDatabase().orders.map(toCustomerOrderSummary);
    return ok({ items: orders, pagination: pagination(orders.length) });
  }),

  http.get('/api/me/orders/by-idempotency-key/:key', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const database = readDatabase();
    const record = database.idempotency.find(
      (candidate) => candidate.scope === 'checkout' && candidate.key === String(params['key']),
    );
    if (!record)
      return apiError(404, 'IDEMPOTENCY_RESULT_NOT_FOUND', 'Todavía no encontramos un resultado.');
    const order = record.response as OpsOrder;
    return ok({
      found: true,
      idempotencyKey: String(params['key']),
      order: toCustomerOrderDetail(order, database),
    });
  }),

  http.get('/api/me/orders/:orderId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const order = readDatabase().orders.find(
      (candidate) => candidate.id === String(params['orderId']),
    );
    return order
      ? ok(toCustomerOrderDetail(order, readDatabase()))
      : apiError(404, 'ORDER_NOT_FOUND', 'El pedido no existe.');
  }),

  http.post('/api/me/orders/:orderId/cancellation-requests', async ({ params, request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const command = (await request.json()) as CreateCancellationCommand;
    const response = createCancellationResponse(
      { ...command, orderId: String(params['orderId']) },
      'Cliente demo',
      'customer',
    );
    return isUncertainScenario() ? HttpResponse.error() : response;
  }),

  http.get('/api/me/cancellation-requests/by-idempotency-key/:key', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const database = readDatabase();
    const record = database.idempotency.find(
      (candidate) =>
        candidate.scope.startsWith('create-cancellation:') &&
        candidate.key === String(params['key']),
    );
    if (!record)
      return apiError(404, 'IDEMPOTENCY_RESULT_NOT_FOUND', 'Todavía no encontramos un resultado.');
    return ok({
      found: true,
      request: customerReceipt(
        record.response as CancellationRequest,
        String(params['key']),
        false,
      ),
    });
  }),

  http.get('/api/ops/operators', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    return ok({ items: readDatabase().operators.map(toOperator) });
  }),

  http.get('/api/ops/orders', async ({ request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const url = new URL(request.url);
    const status = url.searchParams.get('status') ?? '';
    const cancellation = url.searchParams.get('cancellationStatus') ?? '';
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
    return ok({
      items: items.map(toOpsOrderSummary),
      pagination: pagination(items.length),
    });
  }),

  http.get('/api/ops/orders/:orderId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const order = readDatabase().orders.find(
      (candidate) => candidate.id === String(params['orderId']),
    );
    return order
      ? ok(toOpsOrderDetail(order, readDatabase()))
      : apiError(404, 'ORDER_NOT_FOUND', 'La orden no existe.');
  }),

  http.post('/api/ops/cancellation-requests', async ({ request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const command = (await request.json()) as CreateCancellationCommand;
    const database = readDatabase();
    const response = createCancellationResponse(
      command,
      selectedOperatorName(request, database),
      'ops',
    );
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
    return ok({
      items: requests.map(toCancellationSummary),
      pagination: pagination(requests.length),
      counts: {
        pending: database.requests.filter((request) => request.status === 'PENDING').length,
        completed: database.requests.filter((request) => request.status === 'COMPLETED').length,
        rejected: database.requests.filter((request) => request.status === 'REJECTED').length,
      },
    });
  }),

  http.get(
    '/api/ops/cancellation-requests/by-idempotency-key/:key',
    async ({ params, request }) => {
      const blocked = await preflight();
      if (blocked) return blocked;
      const database = readDatabase();
      const scope = new URL(request.url).searchParams.get('scope') ?? 'CREATE';
      const expectedScopePrefix =
        scope === 'APPROVE' ? 'approve:' : scope === 'REJECT' ? 'reject:' : 'create-cancellation:';
      const record = database.idempotency.find(
        (candidate) =>
          candidate.scope.startsWith(expectedScopePrefix) &&
          candidate.key === String(params['key']),
      );
      if (!record)
        return apiError(
          404,
          'IDEMPOTENCY_RESULT_NOT_FOUND',
          'Todavía no encontramos un resultado.',
        );
      const cancellation = record.response as CancellationRequest;
      const order = database.orders.find((candidate) => candidate.id === cancellation.orderId);
      return ok({
        found: true,
        scope,
        request: toCancellationDetail(cancellation, database),
        order: order ? toOpsOrderDetail(order, database) : null,
      });
    },
  ),

  http.get('/api/ops/cancellation-requests/:requestId', async ({ params }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const database = readDatabase();
    const request = database.requests.find(
      (candidate) => candidate.id === String(params['requestId']),
    );
    return request
      ? ok(toCancellationDetail(withCurrentValidity(request, database), database))
      : apiError(404, 'REQUEST_NOT_FOUND', 'La solicitud no existe.');
  }),

  http.post('/api/ops/cancellation-requests/:requestId/approve', async ({ params, request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const body = (await request.json()) as {
      idempotencyKey: string;
      expectedRequestVersion: number;
      expectedOrderVersion: number;
    };
    const command: ResolveCancellationCommand = {
      idempotencyKey: body.idempotencyKey,
      expectedVersion: body.expectedRequestVersion,
      expectedOrderVersion: body.expectedOrderVersion,
    };
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
        const previousRequest = previous.response as CancellationRequest;
        const previousOrder = database.orders.find(
          (candidate) => candidate.id === previousRequest.orderId,
        );
        if (!previousOrder)
          return apiError(404, 'ORDER_NOT_FOUND', 'La orden ya no estÃ¡ disponible.');
        return ok({
          request: toCancellationDetail(previousRequest, database),
          order: toOpsOrderDetail(previousOrder, database),
          replayed: true,
        });
      }
      if (current.status !== 'PENDING') {
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
      if (command.expectedOrderVersion !== order.version) {
        return apiError(409, 'CONCURRENT_MODIFICATION', 'La orden cambiÃ³ mientras la revisabas.');
      }
      if (order.dispatchedAt !== null) {
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
      return ok({
        request: toCancellationDetail(completed, database),
        order: toOpsOrderDetail(updatedOrder, database),
        replayed: false,
      });
    });
    return isUncertainScenario() ? HttpResponse.error() : response;
  }),

  http.post('/api/ops/cancellation-requests/:requestId/reject', async ({ params, request }) => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const body = (await request.json()) as {
      idempotencyKey: string;
      expectedRequestVersion: number;
      rejectionCode?: string;
      rejectionNote?: string;
    };
    const command: ResolveCancellationCommand = {
      idempotencyKey: body.idempotencyKey,
      expectedVersion: body.expectedRequestVersion,
      rejectionCode: body.rejectionCode,
      rejectionNote: body.rejectionNote,
    };
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
        const previousRequest = previous.response as CancellationRequest;
        const previousOrder = database.orders.find(
          (candidate) => candidate.id === previousRequest.orderId,
        );
        if (!previousOrder)
          return apiError(404, 'ORDER_NOT_FOUND', 'La orden ya no estÃ¡ disponible.');
        return ok({
          request: toCancellationDetail(previousRequest, database),
          order: toOpsOrderDetail(previousOrder, database),
          replayed: true,
        });
      }
      if (current.status !== 'PENDING') {
        return apiError(409, 'REQUEST_ALREADY_RESOLVED', 'Otro operador ya resolvió la solicitud.');
      }
      const rejected: CancellationRequest = {
        ...current,
        status: 'REJECTED',
        resolverName: selectedOperatorName(request, database),
        resolvedAt: new Date().toISOString(),
        rejectionCode: command.rejectionCode ?? 'OTHER',
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
      const order = database.orders.find((candidate) => candidate.id === rejected.orderId);
      if (!order) return apiError(404, 'ORDER_NOT_FOUND', 'La orden no existe.');
      return ok({
        request: toCancellationDetail(rejected, database),
        order: toOpsOrderDetail(order, database),
        replayed: false,
      });
    });
    return isUncertainScenario() ? HttpResponse.error() : response;
  }),

  http.get('/api/ops/cancellation-history', async () => {
    const blocked = await preflight();
    if (blocked) return blocked;
    const items = isEmptyScenario() ? [] : toHistory(readDatabase());
    return ok({ items, pagination: pagination(items.length) });
  }),

  http.post('/api/mock/reset', async () => {
    const database = resetDatabase();
    return ok({
      resetAt: new Date().toISOString(),
      schemaVersion: database.schemaVersion,
      scenario: 'normal',
    });
  }),
];
