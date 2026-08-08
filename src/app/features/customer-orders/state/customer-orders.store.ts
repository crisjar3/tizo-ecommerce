import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';

import type { CustomerOrder } from '../../../core/api/api-contract';
import { TizoApiService } from '../../../core/api/tizo-api.service';
import type { ScreenState } from '../../../core/errors/app-error';
import {
  errorScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';

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
  private readonly api = inject(TizoApiService);

  readonly orders$ = this.select((state) => state.orders);
  readonly selected$ = this.select((state) => state.selected);

  readonly loadOrders = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.patchState({ orders: initialScreenState() })),
      switchMap(() =>
        this.api.listCustomerOrders().pipe(
          tapResponse(
            (orders) => this.patchState({ orders: successScreenState(orders) }),
            (error: unknown) =>
              this.patchState({ orders: errorScreenState(normalizeHttpError(error)) }),
          ),
        ),
      ),
    ),
  );

  readonly loadOrder = this.effect<string>((orderId$) =>
    orderId$.pipe(
      tap(() => this.patchState({ selected: initialScreenState() })),
      switchMap((orderId) =>
        this.api.getCustomerOrder(orderId).pipe(
          tapResponse(
            (order) => this.patchState({ selected: successScreenState(order) }),
            (error: unknown) =>
              this.patchState({ selected: errorScreenState(normalizeHttpError(error)) }),
          ),
        ),
      ),
    ),
  );

  constructor() {
    super(initialState);
  }
}
