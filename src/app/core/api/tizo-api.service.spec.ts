import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import type {
  CheckoutCommand,
  CreateCancellationCommand,
  ResolveCancellationCommand,
} from './api-contract';
import { TizoApiService } from './tizo-api.service';

describe('TizoApiService REST contract', () => {
  let api: TizoApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    api = TestBed.inject(TizoApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses the public catalog, cart and customer order routes', () => {
    api.listProducts().subscribe();
    expectRequest('GET', '/api/catalog/products', []);

    api.getProduct('prod-1').subscribe();
    expectRequest('GET', '/api/catalog/products/prod-1', {});

    api.getCart().subscribe();
    expectRequest('GET', '/api/me/cart', {});

    api.setCartQuantity('prod-1', 2).subscribe();
    const quantity = http.expectOne('/api/me/cart/items/prod-1');
    expect(quantity.request.method).toBe('PUT');
    expect(quantity.request.body).toEqual({ quantity: 2 });
    quantity.flush({});

    api.removeCartItem('prod-1').subscribe();
    expectRequest('DELETE', '/api/me/cart/items/prod-1', {});

    const checkout: CheckoutCommand = { idempotencyKey: 'checkout-key' };
    api.checkout(checkout).subscribe();
    const checkoutRequest = http.expectOne('/api/me/orders');
    expect(checkoutRequest.request.method).toBe('POST');
    expect(checkoutRequest.request.body).toEqual(checkout);
    checkoutRequest.flush({});

    api.listCustomerOrders().subscribe();
    expectRequest('GET', '/api/me/orders', []);

    api.getCustomerOrder('1042').subscribe();
    expectRequest('GET', '/api/me/orders/1042', {});
  });

  it('keeps operations queries and filters under the protected namespace', () => {
    api.listOpsOrders({ page: '2', search: '', status: 'REQUESTED' }).subscribe();
    const list = http.expectOne(
      (request) =>
        request.url === '/api/ops/orders' &&
        request.params.get('page') === '2' &&
        request.params.get('status') === 'REQUESTED' &&
        !request.params.has('search'),
    );
    expect(list.request.method).toBe('GET');
    list.flush({ items: [], page: 2, total: 0 });

    api.getOpsOrder('1042').subscribe();
    expectRequest('GET', '/api/ops/orders/1042', {});

    api.listOperators().subscribe();
    expectRequest('GET', '/api/ops/operators', []);

    api.listCancellationRequests('REQUESTED').subscribe();
    const requests = http.expectOne(
      (request) =>
        request.url === '/api/ops/cancellation-requests' &&
        request.params.get('status') === 'REQUESTED',
    );
    expect(requests.request.method).toBe('GET');
    requests.flush([]);

    api.getCancellationRequest('C-201').subscribe();
    expectRequest('GET', '/api/ops/cancellation-requests/C-201', {});

    api.listCancellationHistory().subscribe();
    expectRequest('GET', '/api/ops/cancellation-history', []);
  });

  it('sends typed idempotent cancellation commands to each intended route', () => {
    const create: CreateCancellationCommand = {
      orderId: '1042',
      itemIds: ['item-1'],
      reasonCode: 'CUSTOMER_REQUEST',
      reasonNote: 'El cliente cambió de opinión.',
      idempotencyKey: 'create-key',
    };
    const resolve: ResolveCancellationCommand = {
      idempotencyKey: 'resolve-key',
      expectedVersion: 1,
    };

    api.createCancellation(create).subscribe();
    expectCommand('/api/ops/cancellation-requests', create);

    api.createCancellation(create, true).subscribe();
    expectCommand('/api/me/orders/1042/cancellation-requests', create);

    api.approveCancellation('C-201', resolve).subscribe();
    expectCommand('/api/ops/cancellation-requests/C-201/approve', resolve);

    api.rejectCancellation('C-201', { ...resolve, rejectionCode: 'NOT_REQUIRED' }).subscribe();
    expectCommand('/api/ops/cancellation-requests/C-201/reject', {
      ...resolve,
      rejectionCode: 'NOT_REQUIRED',
    });

    api.reconcileCancellation('resolve-key').subscribe();
    expectRequest('GET', '/api/ops/cancellation-requests/by-idempotency-key/resolve-key', {});

    api.resetDemoData().subscribe((result) => expect(result).toBeUndefined());
    expectCommand('/api/mock/reset', {});
  });

  function expectRequest(method: string, url: string, body: object): void {
    const request = http.expectOne(url);
    expect(request.request.method).toBe(method);
    request.flush(body);
  }

  function expectCommand(url: string, body: object): void {
    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({});
  }
});
