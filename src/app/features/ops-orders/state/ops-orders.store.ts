import { inject, Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { switchMap, tap } from 'rxjs';

import type { OpsOrder, PaginatedOrders } from '../../../core/api/api-contract';
import { TizoApiService } from '../../../core/api/tizo-api.service';
import type { ScreenState } from '../../../core/errors/app-error';
import {
  errorScreenState,
  initialScreenState,
  successScreenState,
} from '../../../core/errors/app-error';
import { normalizeHttpError } from '../../../core/errors/error-mapper';

interface OpsOrdersState {
  readonly orders: ScreenState<PaginatedOrders>;
  readonly selected: ScreenState<OpsOrder>;
}

@Injectable()
export class OpsOrdersStore extends ComponentStore<OpsOrdersState> {
  private readonly api = inject(TizoApiService);
  readonly orders$ = this.select((state) => state.orders);
  readonly selected$ = this.select((state) => state.selected);

  readonly loadOrders = this.effect<Readonly<Record<string, string>>>((filters$) =>
    filters$.pipe(
      tap(() => this.patchState({ orders: initialScreenState() })),
      switchMap((filters) =>
        this.api.listOpsOrders(filters).pipe(
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
        this.api.getOpsOrder(orderId).pipe(
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
    super({ orders: initialScreenState(), selected: initialScreenState() });
  }
}
