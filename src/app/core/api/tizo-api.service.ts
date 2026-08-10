import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, timeout } from 'rxjs';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from './api-base-url.token';
import type {
  AuditEvent,
  CancellationRequest,
  Cart,
  CheckoutCommand,
  CreateCancellationCommand,
  CustomerOrder,
  Operator,
  OpsOrder,
  PaginatedOrders,
  Product,
  ResolveCancellationCommand,
} from './api-contract';

const READ_TIMEOUT = 10_000;
const COMMAND_TIMEOUT = 15_000;

@Injectable({ providedIn: 'root' })
export class TizoApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  listProducts(): Observable<readonly Product[]> {
    return this.http
      .get<readonly Product[]>(`${this.base}/catalog/products`)
      .pipe(timeout(READ_TIMEOUT));
  }

  getProduct(productId: string): Observable<Product> {
    return this.http
      .get<Product>(`${this.base}/catalog/products/${productId}`)
      .pipe(timeout(READ_TIMEOUT));
  }

  getCart(): Observable<Cart> {
    return this.http.get<Cart>(`${this.base}/me/cart`).pipe(timeout(READ_TIMEOUT));
  }

  setCartQuantity(productId: string, quantity: number): Observable<Cart> {
    return this.http
      .put<Cart>(`${this.base}/me/cart/items/${productId}`, { quantity })
      .pipe(timeout(COMMAND_TIMEOUT));
  }

  removeCartItem(productId: string): Observable<Cart> {
    return this.http
      .delete<Cart>(`${this.base}/me/cart/items/${productId}`)
      .pipe(timeout(COMMAND_TIMEOUT));
  }

  checkout(command: CheckoutCommand): Observable<CustomerOrder> {
    return this.http
      .post<CustomerOrder>(`${this.base}/me/orders`, command)
      .pipe(timeout(COMMAND_TIMEOUT));
  }

  listCustomerOrders(): Observable<readonly CustomerOrder[]> {
    return this.http
      .get<readonly CustomerOrder[]>(`${this.base}/me/orders`)
      .pipe(timeout(READ_TIMEOUT));
  }

  getCustomerOrder(orderId: string): Observable<CustomerOrder> {
    return this.http
      .get<CustomerOrder>(`${this.base}/me/orders/${orderId}`)
      .pipe(timeout(READ_TIMEOUT));
  }

  listOpsOrders(filters: Readonly<Record<string, string>> = {}): Observable<PaginatedOrders> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key, value);
    });
    return this.http
      .get<PaginatedOrders>(`${this.base}/ops/orders`, { params })
      .pipe(timeout(READ_TIMEOUT));
  }

  getOpsOrder(orderId: string): Observable<OpsOrder> {
    return this.http
      .get<OpsOrder>(`${this.base}/ops/orders/${orderId}`)
      .pipe(timeout(READ_TIMEOUT));
  }

  listOperators(): Observable<readonly Operator[]> {
    return this.http
      .get<readonly Operator[]>(`${this.base}/ops/operators`)
      .pipe(timeout(READ_TIMEOUT));
  }

  createCancellation(
    command: CreateCancellationCommand,
    customer = false,
  ): Observable<CancellationRequest> {
    const url = customer
      ? `${this.base}/me/orders/${command.orderId}/cancellation-requests`
      : `${this.base}/ops/cancellation-requests`;
    return this.http.post<CancellationRequest>(url, command).pipe(timeout(COMMAND_TIMEOUT));
  }

  listCancellationRequests(status = ''): Observable<readonly CancellationRequest[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http
      .get<readonly CancellationRequest[]>(`${this.base}/ops/cancellation-requests`, { params })
      .pipe(timeout(READ_TIMEOUT));
  }

  getCancellationRequest(requestId: string): Observable<CancellationRequest> {
    return this.http
      .get<CancellationRequest>(`${this.base}/ops/cancellation-requests/${requestId}`)
      .pipe(timeout(READ_TIMEOUT));
  }

  approveCancellation(
    requestId: string,
    command: ResolveCancellationCommand,
  ): Observable<CancellationRequest> {
    return this.http
      .post<CancellationRequest>(
        `${this.base}/ops/cancellation-requests/${requestId}/approve`,
        command,
      )
      .pipe(timeout(COMMAND_TIMEOUT));
  }

  rejectCancellation(
    requestId: string,
    command: ResolveCancellationCommand,
  ): Observable<CancellationRequest> {
    return this.http
      .post<CancellationRequest>(
        `${this.base}/ops/cancellation-requests/${requestId}/reject`,
        command,
      )
      .pipe(timeout(COMMAND_TIMEOUT));
  }

  reconcileCancellation(idempotencyKey: string): Observable<CancellationRequest> {
    return this.http
      .get<CancellationRequest>(
        `${this.base}/ops/cancellation-requests/by-idempotency-key/${idempotencyKey}`,
      )
      .pipe(timeout(READ_TIMEOUT));
  }

  listCancellationHistory(): Observable<readonly AuditEvent[]> {
    return this.http
      .get<readonly AuditEvent[]>(`${this.base}/ops/cancellation-history`)
      .pipe(timeout(READ_TIMEOUT));
  }

  resetDemoData(): Observable<void> {
    return this.http.post(`${this.base}/mock/reset`, {}).pipe(
      map(() => undefined),
      timeout(COMMAND_TIMEOUT),
    );
  }
}
