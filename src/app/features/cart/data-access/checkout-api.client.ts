import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
import type { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import type { CheckoutCommand, CustomerOrder } from '../../../core/api/api-contract';
import type { components } from '../../../core/api/generated/tizo-api.types';
import { withCommandPolicy, withReadPolicy } from '../../../core/api/http-policies';
import { mapCustomerOrderDetail } from '../../customer-orders/public-api';

type CreateOrderResponseDto = components['schemas']['CreateOrderResponse'];
type CheckoutReconciliationDto = components['schemas']['CheckoutReconciliationResponse'];

@Injectable({ providedIn: 'root' })
export class CheckoutApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  checkout(command: CheckoutCommand): Observable<CustomerOrder> {
    return this.http.post<CreateOrderResponseDto>(`${this.base}/me/orders`, command).pipe(
      withCommandPolicy(),
      map((response) => mapCustomerOrderDetail(response.order)),
    );
  }

  reconcile(idempotencyKey: string): Observable<CustomerOrder> {
    return this.http
      .get<CheckoutReconciliationDto>(
        `${this.base}/me/orders/by-idempotency-key/${encodeURIComponent(idempotencyKey)}`,
      )
      .pipe(
        withReadPolicy(),
        map((response) => mapCustomerOrderDetail(response.order)),
      );
  }
}
