import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import type { OpsOrder, PaginatedOrders } from '../../../core/api/api-contract';
import type { components } from '../../../core/api/generated/tizo-api.types';
import { withReadPolicy } from '../../../core/api/http-policies';
import { mapOpsOrderDto, mapPaginatedOpsOrdersDto } from './ops-order.mapper';

type OpsOrderListDto = components['schemas']['OpsOrderListResponse'];
type OpsOrderDetailDto = components['schemas']['OpsOrderDetail'];

@Injectable({ providedIn: 'root' })
export class OpsOrdersApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  list(filters: Readonly<Record<string, string>> = {}): Observable<PaginatedOrders> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params = params.set(key === 'cancellation' ? 'cancellationStatus' : key, value);
    });

    return this.http
      .get<OpsOrderListDto>(`${this.base}/ops/orders`, { params })
      .pipe(withReadPolicy(), map(mapPaginatedOpsOrdersDto));
  }

  get(orderId: string): Observable<OpsOrder> {
    return this.http
      .get<OpsOrderDetailDto>(`${this.base}/ops/orders/${orderId}`)
      .pipe(withReadPolicy(), map(mapOpsOrderDto));
  }
}
