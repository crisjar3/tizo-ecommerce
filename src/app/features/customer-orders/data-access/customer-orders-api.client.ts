import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import type {
  CustomerOrder,
  CustomerOrderStatus,
  RefundStatus,
} from '../../../core/api/api-contract';
import type { components } from '../../../core/api/generated/tizo-api.types';
import { withReadPolicy } from '../../../core/api/http-policies';
import { resolveProductImage } from '../../../core/api/product-image';

type CustomerOrderSummaryDto = components['schemas']['CustomerOrderSummary'];
type CustomerOrderDetailDto = components['schemas']['CustomerOrderDetail'];
type CustomerOrderListDto = components['schemas']['CustomerOrderListResponse'];

@Injectable({ providedIn: 'root' })
export class CustomerOrdersApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(page = 1, pageSize = 20): Observable<readonly CustomerOrder[]> {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);
    return this.http.get<CustomerOrderListDto>(`${this.base}/me/orders`, { params }).pipe(
      withReadPolicy(),
      map((response) => response.items.map(mapCustomerOrderSummary)),
    );
  }

  get(orderId: string): Observable<CustomerOrder> {
    return this.http
      .get<CustomerOrderDetailDto>(`${this.base}/me/orders/${orderId}`)
      .pipe(withReadPolicy(), map(mapCustomerOrderDetail));
  }
}

export function mapCustomerOrderSummary(dto: CustomerOrderSummaryDto): CustomerOrder {
  return {
    id: dto.id,
    createdAt: dto.createdAt,
    status: mapCustomerStatus(dto),
    itemCount: dto.totalItems,
    items: [],
    paidTotal: { ...dto.paidTotal },
    cancelledTotal: subtractMoney(dto.paidTotal, dto.activeTotal),
    activeTotal: { ...dto.activeTotal },
  };
}

export function mapCustomerOrderDetail(dto: CustomerOrderDetailDto): CustomerOrder {
  const refundStatus: RefundStatus = dto.cancellation?.refund.status ?? 'NOT_REQUIRED';
  return {
    ...mapCustomerOrderSummary(dto),
    items: dto.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      lineTotal: { ...item.lineTotal },
      cancelled: item.customerStatus === 'CANCELLED',
      refundStatus,
      imageUrl: resolveProductImage(item.productId, item.imageUrl),
      cancellable: item.cancellable,
    })),
    version: dto.version,
  };
}

function mapCustomerStatus(dto: CustomerOrderSummaryDto): CustomerOrderStatus {
  return dto.cancellationStatus === 'FULL' ? 'CANCELLED' : dto.status;
}

function subtractMoney(
  paid: components['schemas']['Money'],
  active: components['schemas']['Money'],
): components['schemas']['Money'] {
  return {
    amountMinor: Math.max(0, paid.amountMinor - active.amountMinor),
    currency: paid.currency,
  };
}
