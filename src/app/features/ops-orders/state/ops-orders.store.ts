import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';

import type { OpsOrder, PaginatedOrders } from '../../../core/api/api-contract';
import type { ScreenState } from '../../../core/errors/app-error';
import {
  beginScreenState,
  failScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';
import { OpsOrdersApiClient } from '../data-access/ops-orders-api.client';

interface OpsOrdersState {
  readonly orders: ScreenState<PaginatedOrders>;
  readonly selected: ScreenState<OpsOrder>;
}

@Injectable()
export class OpsOrdersStore extends ComponentStore<OpsOrdersState> {
  private readonly api = inject(OpsOrdersApiClient);
  readonly orders$ = this.select((state) => state.orders);
  readonly selected$ = this.select((state) => state.selected);

  readonly loadOrders = this.effect<Readonly<Record<string, string>>>((filters$) =>
    filters$.pipe(
      tap(() => this.patchState({ orders: beginScreenState(this.get().orders) })),
      switchMap((filters) =>
        this.api.list(filters).pipe(
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
    super({ orders: initialScreenState(), selected: initialScreenState() });
  }
}
