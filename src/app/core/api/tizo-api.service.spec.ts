import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CancellationsApiClient } from '../../features/cancellations/data-access/cancellations-api.client';
import { CartApiClient } from '../../features/cart/data-access/cart-api.client';
import { CheckoutApiClient } from '../../features/cart/data-access/checkout-api.client';
import { CatalogApiClient } from '../../features/catalog/data-access/catalog-api.client';
import { CustomerOrdersApiClient } from '../../features/customer-orders/data-access/customer-orders-api.client';
import { OperatorsApiClient } from '../../features/operators/data-access/operators-api.client';
import { OpsOrdersApiClient } from '../../features/ops-orders/data-access/ops-orders-api.client';
import { DemoApiClient } from '../demo/demo-api.client';
import type { components } from './generated/tizo-api.types';

type Schema = components['schemas'];

const money: Schema['Money'] = { amountMinor: 189000, currency: 'ARS' };
const pagination: Schema['Pagination'] = {
  page: 1,
  pageSize: 20,
  totalItems: 1,
  totalPages: 1,
};
const product: Schema['ProductSummary'] = {
  id: 'product-001',
  name: 'Remera Essential',
  description: 'Algodón pesado.',
  category: 'Indumentaria',
  imageUrl: 'https://images.example.test/product-001.jpg',
  price: money,
  availableStock: 5,
  available: true,
};
const productDetail: Schema['ProductDetail'] = {
  ...product,
  longDescription: 'Una remera para todos los días.',
  imageUrls: [product.imageUrl],
  attributes: [{ name: 'Material', value: 'Algodón' }],
};
const cart: Schema['Cart'] = {
  id: 'cart-1',
  customerId: 'customer-001',
  items: [
    {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      unitPrice: money,
      quantity: 1,
      lineTotal: money,
      availableStock: 5,
    },
  ],
  subtotal: money,
  totalItems: 1,
  updatedAt: '2026-08-10T10:00:00.000Z',
};
const customerSummary: Schema['CustomerOrderSummary'] = {
  id: 'order-1',
  displayNumber: '1001',
  createdAt: '2026-08-10T10:00:00.000Z',
  status: 'AWAITING_STORES',
  cancellationStatus: 'NONE',
  progressStatus: 'PENDING',
  paidTotal: money,
  activeTotal: money,
  totalItems: 1,
  cancelledItems: 0,
};
const address: Schema['CustomerAddress'] = {
  recipientName: 'Ana Martínez',
  line1: 'Calle 1',
  line2: null,
  city: 'Buenos Aires',
  region: 'CABA',
  postalCode: '1000',
  countryCode: 'AR',
};
const customerDetail: Schema['CustomerOrderDetail'] = {
  ...customerSummary,
  items: [
    {
      id: 'item-1',
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      quantity: 1,
      unitPrice: money,
      lineTotal: money,
      customerStatus: 'CONFIRMED',
      cancellable: true,
    },
  ],
  deliveryAddress: address,
  cancellation: null,
  version: 1,
};
const opsSummary: Schema['OpsOrderSummary'] = {
  id: customerSummary.id,
  displayNumber: customerSummary.displayNumber,
  customer: { id: 'customer-001', name: 'Ana Martínez', email: 'ana@example.test' },
  createdAt: customerSummary.createdAt,
  updatedAt: customerSummary.createdAt,
  status: customerSummary.status,
  cancellationStatus: 'NONE',
  dispatchedAt: null,
  paidTotal: money,
  activeTotal: money,
  totalItems: 1,
  cancelledItems: 0,
  version: 1,
};
const opsDetail: Schema['OpsOrderDetail'] = {
  ...opsSummary,
  items: [
    {
      id: 'item-1',
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrl,
      storeId: 'store-1',
      storeName: 'Norte Studio',
      quantity: 1,
      unitPrice: money,
      lineTotal: money,
      status: 'PREPARING',
      cancellable: true,
      cancelledAt: null,
    },
  ],
  deliveryAddress: address,
  stores: [{ id: 'store-1', name: 'Norte Studio' }],
  hub: null,
  activeCancellationRequestId: null,
  cancellationEligibility: { eligible: true, eligibleItemIds: ['item-1'], blockedBy: null },
};
const actor: Schema['CancellationActor'] = {
  type: 'OPERATOR',
  id: 'operator-1',
  name: 'Mariana Sosa',
};
const cancellationDetail: Schema['CancellationRequestDetail'] = {
  id: 'cancel-1',
  orderId: opsSummary.id,
  orderDisplayNumber: opsSummary.displayNumber,
  status: 'PENDING',
  requestedBy: actor,
  resolvedBy: null,
  requestedAt: '2026-08-10T10:10:00.000Z',
  resolvedAt: null,
  reasonCode: 'CUSTOMER_REQUEST',
  reasonNote: null,
  rejectionCode: null,
  rejectionNote: null,
  items: [
    {
      itemId: 'item-1',
      productId: product.id,
      productName: product.name,
      storeId: 'store-1',
      storeName: 'Norte Studio',
      quantity: 1,
      unitPrice: money,
      requestedAmount: money,
      currentStatus: 'PREPARING',
      stillCancellable: true,
    },
  ],
  requestedAmount: money,
  currentAffectedAmount: money,
  effectiveOrderId: null,
  expectedOrderVersion: 1,
  currentOrderVersion: 1,
  orderDispatchedAt: null,
  stillValid: true,
  invalidatedBy: null,
  refund: {
    status: 'NOT_REQUIRED',
    amount: null,
    providerReference: null,
    updatedAt: null,
    failureCode: null,
  },
  effects: [],
  audit: [],
  version: 1,
};

describe('official API clients', () => {
  let catalogApi: CatalogApiClient;
  let cartApi: CartApiClient;
  let checkoutApi: CheckoutApiClient;
  let customerOrdersApi: CustomerOrdersApiClient;
  let opsOrdersApi: OpsOrdersApiClient;
  let operatorsApi: OperatorsApiClient;
  let cancellationsApi: CancellationsApiClient;
  let demoApi: DemoApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    catalogApi = TestBed.inject(CatalogApiClient);
    cartApi = TestBed.inject(CartApiClient);
    checkoutApi = TestBed.inject(CheckoutApiClient);
    customerOrdersApi = TestBed.inject(CustomerOrdersApiClient);
    opsOrdersApi = TestBed.inject(OpsOrdersApiClient);
    operatorsApi = TestBed.inject(OperatorsApiClient);
    cancellationsApi = TestBed.inject(CancellationsApiClient);
    demoApi = TestBed.inject(DemoApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps catalog, cart, checkout and customer order responses', () => {
    catalogApi.list().subscribe((items) => expect(items[0]?.id).toBe(product.id));
    expectGet('/api/catalog/products').flush({ items: [product], pagination });

    catalogApi.get(product.id).subscribe((item) => expect(item.imageAlt).toBe(product.name));
    expectGet(`/api/catalog/products/${product.id}`).flush(productDetail);

    cartApi.get().subscribe((result) => expect(result.itemCount).toBe(1));
    expectGet('/api/me/cart').flush(cart);

    cartApi.setQuantity(product.id, 2).subscribe();
    const update = http.expectOne(`/api/me/cart/items/${product.id}`);
    expect(update.request.method).toBe('PUT');
    expect(update.request.body).toEqual({ quantity: 2 });
    update.flush(cart);

    cartApi.remove(product.id).subscribe((result) => expect(result.itemCount).toBe(1));
    const remove = http.expectOne(`/api/me/cart/items/${product.id}`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 204, statusText: 'No Content' });
    expectGet('/api/me/cart').flush(cart);

    checkoutApi
      .checkout({ idempotencyKey: 'checkout-key' })
      .subscribe((order) => expect(order.id).toBe(customerDetail.id));
    const checkout = http.expectOne('/api/me/orders');
    expect(checkout.request.body).toEqual({ idempotencyKey: 'checkout-key' });
    checkout.flush({ order: customerDetail, idempotencyKey: 'checkout-key', created: true });

    customerOrdersApi.list().subscribe((orders) => expect(orders.length).toBe(1));
    const orders = http.expectOne(
      (request) => request.url === '/api/me/orders' && request.params.get('page') === '1',
    );
    orders.flush({ items: [customerSummary], pagination });

    customerOrdersApi.get(customerDetail.id).subscribe();
    expectGet(`/api/me/orders/${customerDetail.id}`).flush(customerDetail);
  });

  it('maps operations lists, details, operators and history', () => {
    opsOrdersApi.list({ page: '2', status: 'AWAITING_STORES' }).subscribe();
    const orders = http.expectOne(
      (request) =>
        request.url === '/api/ops/orders' &&
        request.params.get('page') === '2' &&
        request.params.get('status') === 'AWAITING_STORES',
    );
    orders.flush({ items: [opsSummary], pagination });

    opsOrdersApi
      .get(opsDetail.id)
      .subscribe((order) => expect(order.customerName).toBe('Ana Martínez'));
    expectGet(`/api/ops/orders/${opsDetail.id}`).flush(opsDetail);

    operatorsApi.list().subscribe((operators) => expect(operators[0]?.initials).toBe('MS'));
    const operators = http.expectOne(
      (request) => request.url === '/api/ops/operators' && request.params.get('active') === 'true',
    );
    operators.flush({
      items: [
        {
          id: 'operator-1',
          name: 'Mariana Sosa',
          email: 'mariana@example.test',
          avatarUrl: null,
          role: 'OPERATOR',
          active: true,
        },
      ],
    });

    cancellationsApi.list('PENDING').subscribe();
    const requests = http.expectOne(
      (request) =>
        request.url === '/api/ops/cancellation-requests' &&
        request.params.get('status') === 'PENDING',
    );
    requests.flush({
      items: [
        {
          id: cancellationDetail.id,
          orderId: cancellationDetail.orderId,
          orderDisplayNumber: cancellationDetail.orderDisplayNumber,
          status: 'PENDING',
          requestedBy: actor,
          requestedAt: cancellationDetail.requestedAt,
          resolvedAt: null,
          reasonCode: 'CUSTOMER_REQUEST',
          requestedAmount: money,
          itemCount: 1,
        },
      ],
      pagination,
      counts: { pending: 1, completed: 0, rejected: 0 },
    });

    cancellationsApi.get(cancellationDetail.id).subscribe();
    expectGet(`/api/ops/cancellation-requests/${cancellationDetail.id}`).flush(cancellationDetail);

    cancellationsApi.history().subscribe((events) => expect(events[0]?.orderId).toBe('order-1'));
    expectGet('/api/ops/cancellation-history').flush({
      items: [
        {
          requestId: 'cancel-2',
          orderId: 'order-1',
          orderDisplayNumber: '1001',
          status: 'COMPLETED',
          reasonCode: 'CUSTOMER_REQUEST',
          rejectionCode: null,
          requestedBy: actor,
          resolvedBy: actor,
          requestedAt: '2026-08-10T10:00:00.000Z',
          resolvedAt: '2026-08-10T11:00:00.000Z',
          affectedAmount: money,
          refundStatus: 'PENDING',
        },
      ],
      pagination,
    });
  });

  it('sends official concurrency and idempotency command shapes', () => {
    const create = {
      orderId: 'order-1',
      itemIds: ['item-1'],
      reasonCode: 'CUSTOMER_REQUEST',
      reasonNote: 'Cambio de opinión',
      idempotencyKey: 'create-key',
      expectedOrderVersion: 1,
    };

    cancellationsApi.create(create, false).subscribe();
    const opsCreate = http.expectOne('/api/ops/cancellation-requests');
    expect(opsCreate.request.body).toEqual({ ...create });
    opsCreate.flush({ request: cancellationDetail, idempotencyKey: 'create-key', created: true });

    cancellationsApi.create(create, true).subscribe();
    const customerCreate = http.expectOne('/api/me/orders/order-1/cancellation-requests');
    expect(customerCreate.request.body).toEqual({
      itemIds: ['item-1'],
      reasonCode: 'CUSTOMER_REQUEST',
      reasonNote: 'Cambio de opinión',
      idempotencyKey: 'create-key',
      expectedOrderVersion: 1,
    });
    customerCreate.flush({
      requestId: 'cancel-1',
      orderId: 'order-1',
      status: 'PENDING',
      itemIds: ['item-1'],
      affectedAmount: money,
      requestedAt: cancellationDetail.requestedAt,
      idempotencyKey: 'create-key',
      created: true,
    });

    const resolve = { idempotencyKey: 'resolve-key', expectedVersion: 1, expectedOrderVersion: 1 };
    cancellationsApi.approve('cancel-1', resolve).subscribe();
    const approve = http.expectOne('/api/ops/cancellation-requests/cancel-1/approve');
    expect(approve.request.body).toEqual({
      idempotencyKey: 'resolve-key',
      expectedRequestVersion: 1,
      expectedOrderVersion: 1,
    });
    approve.flush({ request: cancellationDetail, order: opsDetail, replayed: false });

    cancellationsApi.reject('cancel-1', { ...resolve, rejectionCode: 'OTHER' }).subscribe();
    const reject = http.expectOne('/api/ops/cancellation-requests/cancel-1/reject');
    expect(reject.request.body).toEqual({
      idempotencyKey: 'resolve-key',
      expectedRequestVersion: 1,
      rejectionCode: 'OTHER',
      rejectionNote: undefined,
    });
    reject.flush({ request: cancellationDetail, order: opsDetail, replayed: false });

    cancellationsApi.reconcileOps('resolve-key', 'CREATE').subscribe();
    const reconcile = http.expectOne(
      (request) =>
        request.url === '/api/ops/cancellation-requests/by-idempotency-key/resolve-key' &&
        request.params.get('scope') === 'CREATE',
    );
    reconcile.flush({ found: true, scope: 'CREATE', request: cancellationDetail, order: null });

    demoApi.reset().subscribe((result) => expect(result).toBeUndefined());
    const reset = http.expectOne('/api/mock/reset');
    expect(reset.request.method).toBe('POST');
    reset.flush({ schemaVersion: 1, scenario: 'normal' });
  });

  function expectGet(url: string) {
    const request = http.expectOne(url);
    expect(request.request.method).toBe('GET');
    return request;
  }
});
