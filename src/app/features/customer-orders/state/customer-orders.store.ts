import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';

import type { CustomerOrder } from '../../../core/api/api-contract';
import type { ScreenState } from '../../../core/errors/app-error';
import {
  beginScreenState,
  failScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';
import { CustomerOrdersApiClient } from '../data-access/customer-orders-api.client';

interface CustomerOrdersState {
  readonly orders: ScreenState<readonly CustomerOrder[]>;
  readonly selected: ScreenState<CustomerOrder>;
}

const initialState: CustomerOrdersState = {
  orders: initialScreenState(),
  selected: initialScreenState(),
};

@Injectable()
export class CustomerOrdersStore extends ComponentStore<CustomerOrdersState> {
  private readonly api = inject(CustomerOrdersApiClient);

  readonly orders$ = this.select((state) => state.orders);
  readonly selected$ = this.select((state) => state.selected);

  readonly loadOrders = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ orders: beginScreenState(this.get().orders) })),
      switchMap(() =>
        this.api.list().pipe(
          tapResponse(
            (orders) => this.patchState({ orders: successScreenState(orders) }),
            (error: unknown) =>
              this.patchState({
                orders: failScreenState(this.get().orders, normalizeHttpError(error)),
              }),
          ),
        ),
      ),
    ),
  );

  readonly loadOrder = this.effect<string>((orderId$) =>
    orderId$.pipe(
      tap(() => this.patchState({ selected: beginScreenState(this.get().selected) })),
      switchMap((orderId) =>
        this.api.get(orderId).pipe(
          tapResponse(
            (order) => this.patchState({ selected: successScreenState(order) }),
            (error: unknown) =>
              this.patchState({
                selected: failScreenState(this.get().selected, normalizeHttpError(error)),
              }),
          ),
        ),
      ),
    ),
  );

  constructor() {
    super(initialState);
  }
}
